import { Request, Response } from 'express';
import { Application, Organization, Release } from '../../models';
import axios from 'axios';
import AdmZip from 'adm-zip';

function getAllowedUploadsBaseUrl(req: Request): string {
  const envBaseUrl = process.env.API_BASE_URL;
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function assertSafeUploadsUrl(bundleUrl: string, req: Request) {
  let parsed: URL;
  try {
    parsed = new URL(bundleUrl);
  } catch {
    throw new Error('bundleUrl must be an absolute URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('bundleUrl must use http or https');
  }

  const allowedBase = getAllowedUploadsBaseUrl(req);
  const allowed = new URL(`${allowedBase}/uploads/`);

  if (parsed.origin !== allowed.origin) {
    throw new Error('bundleUrl must point to this API server');
  }

  if (!parsed.pathname.startsWith('/uploads/')) {
    throw new Error('bundleUrl must be under /uploads/');
  }
}

async function validatePatchZipManifest(options: {
  bundleUrl: string;
  expectedPatchFromVersion: string;
  expectedTargetVersion: string;
  req: Request;
}) {
  assertSafeUploadsUrl(options.bundleUrl, options.req);

  const resp = await axios.get<ArrayBuffer>(options.bundleUrl, {
    responseType: 'arraybuffer',
    timeout: 30_000,
    maxContentLength: 200 * 1024 * 1024,
    maxBodyLength: 200 * 1024 * 1024,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const zip = new AdmZip(Buffer.from(resp.data));
  const manifestEntry = zip.getEntry('manifest.json');
  if (!manifestEntry) {
    throw new Error('Patch zip must contain manifest.json at root');
  }

  const raw = zip.readAsText(manifestEntry);
  let manifest: any;
  try {
    manifest = JSON.parse(raw);
  } catch {
    throw new Error('manifest.json is not valid JSON');
  }

  if (manifest?.format !== 'ota-zip-overlay-patch') {
    throw new Error('manifest.json: invalid format');
  }

  if (manifest?.bundleType !== 'zip-patch') {
    throw new Error('manifest.json: bundleType must be zip-patch');
  }

  if (manifest?.patchFromVersion !== options.expectedPatchFromVersion) {
    throw new Error('manifest.json: patchFromVersion does not match request');
  }

  if (manifest?.targetVersion !== options.expectedTargetVersion) {
    throw new Error('manifest.json: targetVersion does not match release version');
  }

  if (!Array.isArray(manifest?.files) || manifest.files.length === 0) {
    throw new Error('manifest.json: files must be a non-empty array');
  }

  for (const f of manifest.files) {
    if (!f || typeof f !== 'object') {
      throw new Error('manifest.json: files contains invalid entry');
    }
    if (typeof f.path !== 'string' || !f.path) {
      throw new Error('manifest.json: files[].path is required');
    }
    if (typeof f.hash !== 'string' || !f.hash) {
      throw new Error('manifest.json: files[].hash is required');
    }
    if (typeof f.size !== 'number' || !Number.isFinite(f.size) || f.size < 0) {
      throw new Error('manifest.json: files[].size must be a non-negative number');
    }
  }

  if (manifest.deleteFiles !== undefined && !Array.isArray(manifest.deleteFiles)) {
    throw new Error('manifest.json: deleteFiles must be an array of strings');
  }
}

// GET /api/v1/admin/applications
export const listApplications = async (req: Request, res: Response) => {
  try {
    const applications = await Application.findAll({
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Release,
          as: 'releases',
          attributes: ['id', 'version', 'status', 'released_at'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const data = applications.map((app) => {
      const plain: any = app.toJSON();
      const latestRelease = (plain.releases || []).find((r: any) => r.status === 'active') ||
        (plain.releases || [])[0] ||
        null;

      return {
        id: plain.id,
        name: plain.name,
        bundleId: plain.bundle_id,
        platform: plain.platform,
        isActive: plain.is_active,
        currentVersion: plain.current_version || (latestRelease ? latestRelease.version : null),
        organization: plain.organization
          ? { id: plain.organization.id, name: plain.organization.name, slug: plain.organization.slug }
          : null,
        latestRelease: latestRelease
          ? {
              id: latestRelease.id,
              version: latestRelease.version,
              status: latestRelease.status,
              releasedAt: latestRelease.released_at,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in listApplications:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// POST /api/v1/admin/applications
export const createApplication = async (req: Request, res: Response) => {
  try {
    const { name, bundleId, platform, organizationId } = req.body;

    // Validate required fields
    if (!name || !bundleId || !platform) {
      return res.status(400).json({
        success: false,
        message: 'name, bundleId, and platform are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Validate platform
    if (!['ios', 'android', 'both'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'platform must be ios, android, or both',
        timestamp: new Date().toISOString(),
      });
    }

    // Get organization (use first one if not specified)
    let orgId = organizationId;
    if (!orgId) {
      const org = await Organization.findOne();
      if (!org) {
        return res.status(400).json({
          success: false,
          message: 'No organization found. Please create an organization first.',
          timestamp: new Date().toISOString(),
        });
      }
      orgId = org.id;
    }

    // Check if application already exists
    const existing = await Application.findOne({
      where: { organization_id: orgId, bundle_id: bundleId, platform },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Application with bundle ID ${bundleId} and platform ${platform} already exists`,
        timestamp: new Date().toISOString(),
      });
    }

    // Create application
    const application = await Application.create({
      organization_id: orgId,
      name,
      bundle_id: bundleId,
      platform,
      is_active: true,
    });

    const plain: any = application.toJSON();

    return res.status(201).json({
      success: true,
      data: {
        id: plain.id,
        name: plain.name,
        bundleId: plain.bundle_id,
        platform: plain.platform,
        isActive: plain.is_active,
        createdAt: plain.created_at,
      },
      message: 'Application created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in createApplication:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// PUT /api/v1/admin/applications/:id
export const updateApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, bundleId, platform, isActive } = req.body;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Update fields if provided
    if (name !== undefined) application.set('name', name);
    if (bundleId !== undefined) application.set('bundle_id', bundleId);
    if (platform !== undefined) {
      if (!['ios', 'android', 'both'].includes(platform)) {
        return res.status(400).json({
          success: false,
          message: 'platform must be ios, android, or both',
          timestamp: new Date().toISOString(),
        });
      }
      application.set('platform', platform);
    }
    if (isActive !== undefined) application.set('is_active', isActive);

    await application.save();

    const plain: any = application.toJSON();

    return res.json({
      success: true,
      data: {
        id: plain.id,
        name: plain.name,
        bundleId: plain.bundle_id,
        platform: plain.platform,
        isActive: plain.is_active,
        updatedAt: plain.updated_at,
      },
      message: 'Application updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in updateApplication:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// DELETE /api/v1/admin/applications/:id
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Delete associated releases first
    await Release.destroy({ where: { application_id: id } });

    // Delete the application
    await application.destroy();

    return res.json({
      success: true,
      message: 'Application deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in deleteApplication:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// GET /api/v1/admin/applications/:id
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Release,
          as: 'releases',
          attributes: [
            'id',
            'version',
            'build_number',
            'bundle_url',
            'bundle_hash',
            'bundle_size',
            'min_app_version',
            'release_notes',
            'rollout_percentage',
            'is_mandatory',
            'status',
            'released_at',
            'created_at',
          ],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        timestamp: new Date().toISOString(),
      });
    }

    const plain: any = application.toJSON();

    const data = {
      id: plain.id,
      name: plain.name,
      bundleId: plain.bundle_id,
      platform: plain.platform,
      isActive: plain.is_active,
      currentVersion: plain.current_version,
      createdAt: plain.created_at,
      updatedAt: plain.updated_at,
      organization: plain.organization
        ? { id: plain.organization.id, name: plain.organization.name, slug: plain.organization.slug }
        : null,
      releases: (plain.releases || []).map((r: any) => ({
        id: r.id,
        version: r.version,
        buildNumber: r.build_number,
        bundleUrl: r.bundle_url,
        bundleHash: r.bundle_hash,
        bundleSize: r.bundle_size,
        minAppVersion: r.min_app_version,
        releaseNotes: r.release_notes,
        rolloutPercentage: r.rollout_percentage,
        isMandatory: r.is_mandatory,
        status: r.status,
        releasedAt: r.released_at,
        createdAt: r.created_at,
      })),
    };

    return res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getApplicationById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// POST /api/v1/admin/applications/:id/releases
export const createRelease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      version,
      buildNumber,
      bundleUrl,
      bundleHash,
      bundleSize,
      bundleType,
      signature,
      patchFromVersion,
      targetPlatform,
      fullBundleUrl,
      fullBundleHash,
      fullBundleSize,
      minAppVersion,
      releaseNotes,
      rolloutPercentage = 0,
      isMandatory = false,
      status = 'draft',
    } = req.body;

    // Validate required fields
    if (!version || !bundleUrl || !bundleHash || !bundleSize) {
      return res.status(400).json({
        success: false,
        message: 'version, bundleUrl, bundleHash, and bundleSize are required',
        timestamp: new Date().toISOString(),
      });
    }

    // A1 safety: patch release must include full bundle fallback
    if (patchFromVersion && (!fullBundleUrl || !fullBundleHash || !fullBundleSize)) {
      return res.status(400).json({
        success: false,
        message: 'fullBundleUrl, fullBundleHash, and fullBundleSize are required when patchFromVersion is provided',
        timestamp: new Date().toISOString(),
      });
    }

    // A1 safety: patch release must be explicitly marked as zip-patch
    if (patchFromVersion && bundleType && bundleType !== 'zip-patch') {
      return res.status(400).json({
        success: false,
        message: 'bundleType must be zip-patch when patchFromVersion is provided',
        timestamp: new Date().toISOString(),
      });
    }

    if (patchFromVersion) {
      try {
        await validatePatchZipManifest({
          bundleUrl,
          expectedPatchFromVersion: patchFromVersion,
          expectedTargetVersion: version,
          req,
        });
      } catch (e: any) {
        return res.status(400).json({
          success: false,
          message: `Invalid patch zip: ${e?.message || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if application exists
    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if version already exists for this application
    const existingRelease = await Release.findOne({
      where: { application_id: id, version },
    });
    if (existingRelease) {
      return res.status(409).json({
        success: false,
        message: `Release version ${version} already exists for this application`,
        timestamp: new Date().toISOString(),
      });
    }

    // Create the release
    const release = await Release.create({
      application_id: id,
      version,
      build_number: buildNumber || 1,
      bundle_url: bundleUrl,
      bundle_hash: bundleHash,
      bundle_size: bundleSize,
      bundle_type: bundleType || null,
      signature: signature || null,
      patch_from_version: patchFromVersion || null,
      target_platform: targetPlatform || null,
      full_bundle_url: fullBundleUrl || null,
      full_bundle_hash: fullBundleHash || null,
      full_bundle_size: fullBundleSize || null,
      min_app_version: minAppVersion || null,
      release_notes: releaseNotes || null,
      rollout_percentage: rolloutPercentage,
      is_mandatory: isMandatory,
      status,
      released_at: status === 'active' ? new Date() : null,
    });

    const plain: any = release.toJSON();

    return res.status(201).json({
      success: true,
      data: {
        id: plain.id,
        version: plain.version,
        buildNumber: plain.build_number,
        bundleUrl: plain.bundle_url,
        bundleHash: plain.bundle_hash,
        bundleSize: plain.bundle_size,
        bundleType: plain.bundle_type,
        signature: plain.signature,
        patchFromVersion: plain.patch_from_version,
        targetPlatform: plain.target_platform,
        fullBundleUrl: plain.full_bundle_url,
        fullBundleHash: plain.full_bundle_hash,
        fullBundleSize: plain.full_bundle_size,
        minAppVersion: plain.min_app_version,
        releaseNotes: plain.release_notes,
        rolloutPercentage: plain.rollout_percentage,
        isMandatory: plain.is_mandatory,
        status: plain.status,
        releasedAt: plain.released_at,
        createdAt: plain.created_at,
      },
      message: 'Release created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in createRelease:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// PUT /api/v1/admin/releases/:releaseId
export const updateRelease = async (req: Request, res: Response) => {
  try {
    const { releaseId } = req.params;
    const {
      version,
      buildNumber,
      bundleUrl,
      bundleHash,
      bundleSize,
      bundleType,
      signature,
      patchFromVersion,
      targetPlatform,
      fullBundleUrl,
      fullBundleHash,
      fullBundleSize,
      minAppVersion,
      releaseNotes,
      rolloutPercentage,
      isMandatory,
      status,
    } = req.body;

    const release = await Release.findByPk(releaseId);
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found',
        timestamp: new Date().toISOString(),
      });
    }

    // A1 safety: patch release must include full bundle fallback
    // If patchFromVersion is explicitly provided (set or changed), require full bundle fallback values.
    if (patchFromVersion !== undefined && patchFromVersion) {
      const nextFullBundleUrl = fullBundleUrl !== undefined ? fullBundleUrl : (release.get('full_bundle_url') as any);
      const nextFullBundleHash = fullBundleHash !== undefined ? fullBundleHash : (release.get('full_bundle_hash') as any);
      const nextFullBundleSize = fullBundleSize !== undefined ? fullBundleSize : (release.get('full_bundle_size') as any);

      if (!nextFullBundleUrl || !nextFullBundleHash || !nextFullBundleSize) {
        return res.status(400).json({
          success: false,
          message: 'fullBundleUrl, fullBundleHash, and fullBundleSize are required when patchFromVersion is provided',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // A1 safety: patch release must be explicitly marked as zip-patch
    if (patchFromVersion !== undefined && patchFromVersion) {
      const nextBundleType = bundleType !== undefined ? bundleType : (release.get('bundle_type') as any);
      if (nextBundleType && nextBundleType !== 'zip-patch') {
        return res.status(400).json({
          success: false,
          message: 'bundleType must be zip-patch when patchFromVersion is provided',
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (patchFromVersion !== undefined && patchFromVersion) {
      const nextBundleUrl = bundleUrl !== undefined ? bundleUrl : (release.get('bundle_url') as any);
      const nextTargetVersion = version !== undefined ? version : (release.get('version') as any);

      try {
        await validatePatchZipManifest({
          bundleUrl: nextBundleUrl,
          expectedPatchFromVersion: patchFromVersion,
          expectedTargetVersion: nextTargetVersion,
          req,
        });
      } catch (e: any) {
        return res.status(400).json({
          success: false,
          message: `Invalid patch zip: ${e?.message || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update fields if provided
    if (version !== undefined) release.set('version', version);
    if (buildNumber !== undefined) release.set('build_number', buildNumber);
    if (bundleUrl !== undefined) release.set('bundle_url', bundleUrl);
    if (bundleHash !== undefined) release.set('bundle_hash', bundleHash);
    if (bundleSize !== undefined) release.set('bundle_size', bundleSize);
    if (bundleType !== undefined) release.set('bundle_type', bundleType);
    if (signature !== undefined) release.set('signature', signature);
    if (patchFromVersion !== undefined) release.set('patch_from_version', patchFromVersion);
    if (targetPlatform !== undefined) release.set('target_platform', targetPlatform);
    if (fullBundleUrl !== undefined) release.set('full_bundle_url', fullBundleUrl);
    if (fullBundleHash !== undefined) release.set('full_bundle_hash', fullBundleHash);
    if (fullBundleSize !== undefined) release.set('full_bundle_size', fullBundleSize);
    if (minAppVersion !== undefined) release.set('min_app_version', minAppVersion);
    if (releaseNotes !== undefined) release.set('release_notes', releaseNotes);
    if (rolloutPercentage !== undefined) release.set('rollout_percentage', rolloutPercentage);
    if (isMandatory !== undefined) release.set('is_mandatory', isMandatory);
    if (status !== undefined) {
      release.set('status', status);
      // Set released_at when status changes to active
      if (status === 'active' && !release.get('released_at')) {
        release.set('released_at', new Date());
      }
    }

    await release.save();

    const plain: any = release.toJSON();

    return res.json({
      success: true,
      data: {
        id: plain.id,
        version: plain.version,
        buildNumber: plain.build_number,
        bundleUrl: plain.bundle_url,
        bundleHash: plain.bundle_hash,
        bundleSize: plain.bundle_size,
        bundleType: plain.bundle_type,
        signature: plain.signature,
        patchFromVersion: plain.patch_from_version,
        targetPlatform: plain.target_platform,
        fullBundleUrl: plain.full_bundle_url,
        fullBundleHash: plain.full_bundle_hash,
        fullBundleSize: plain.full_bundle_size,
        minAppVersion: plain.min_app_version,
        releaseNotes: plain.release_notes,
        rolloutPercentage: plain.rollout_percentage,
        isMandatory: plain.is_mandatory,
        status: plain.status,
        releasedAt: plain.released_at,
        updatedAt: plain.updated_at,
      },
      message: 'Release updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in updateRelease:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// DELETE /api/v1/admin/releases/:releaseId
export const deleteRelease = async (req: Request, res: Response) => {
  try {
    const { releaseId } = req.params;

    const release = await Release.findByPk(releaseId);
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found',
        timestamp: new Date().toISOString(),
      });
    }

    await release.destroy();

    return res.json({
      success: true,
      message: 'Release deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in deleteRelease:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
