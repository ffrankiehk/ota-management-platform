import { Request, Response } from 'express';
import { Application, Release, Device } from '../../models';

// 简单的版本比较函数
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  return 0;
}

type OTAAction = 'none' | 'update' | 'rollback';

/**
 * Determine if a device is eligible for rollout based on percentage
 * Uses consistent hashing to ensure same device always gets same result
 */
function isDeviceEligibleForRollout(deviceId: string, percentage: number): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  
  // Simple hash function for device ID
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    const char = deviceId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to positive number and get percentage (0-99)
  const devicePercentile = Math.abs(hash) % 100;
  
  // Device is eligible if its percentile is less than rollout percentage
  return devicePercentile < percentage;
}

export const checkUpdate = async (req: Request, res: Response) => {
  try {
    // Support both GET (query params) and POST (body params)
    const isGet = req.method === 'GET';
    const params = isGet ? req.query : req.body;
    
    const bundleId = params.bundleId || params.bundle_id;
    const platform = params.platform;
    const currentVersion = params.currentVersion || params.current_version;
    const deviceId = params.deviceId || params.device_id;
    const accountId = params.accountId || params.account_id;
    const rolloutKey = (accountId || deviceId) as string | undefined;

    if (!bundleId || !platform || !currentVersion) {
      return res.status(400).json({
        success: false,
        message: 'bundleId, platform and currentVersion are required',
        timestamp: new Date().toISOString(),
      });
    }

    const application = await Application.findOne({
      where: {
        bundle_id: bundleId,
        platform,
        is_active: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        timestamp: new Date().toISOString(),
      });
    }

    const release = await Release.findOne({
      where: {
        application_id: application.id,
        status: 'active',
      },
      order: [['created_at', 'DESC']],
    });

    if (!release) {
      return res.json({
        success: true,
        data: {
          action: 'none' as OTAAction,
          updateAvailable: false,
          currentVersion,
        },
        message: 'No active releases found',
        timestamp: new Date().toISOString(),
      });
    }

    const compare = compareVersions(currentVersion as string, release.version);
    const isRollback = compare > 0;
    const hasUpdate = compare < 0;

    if (!hasUpdate && !isRollback) {
      return res.json({
        success: true,
        data: {
          action: 'none' as OTAAction,
          updateAvailable: false,
          currentVersion,
          latestVersion: release.version,
        },
        message: 'You are on the latest version',
        timestamp: new Date().toISOString(),
      });
    }

    // Rollback should not be blocked by rollout percentage; if server active version is lower
    // than device version, instruct device to rollback to the active release.
    if (isRollback) {
      // Upsert device if deviceId provided
      if (deviceId) {
        await Device.upsert({
          application_id: application.id,
          device_id: deviceId,
          platform: platform as 'ios' | 'android',
          app_version: currentVersion as string,
          bundle_version: currentVersion as string,
          last_check_at: new Date(),
        });
      }

      return res.json({
        success: true,
        data: {
          action: 'rollback' as OTAAction,
          updateAvailable: true,
          currentVersion: currentVersion as string,
          latestVersion: release.version,
          releaseId: release.id,
          downloadUrl: release.bundle_url,
          bundleHash: release.bundle_hash,
          bundleSize: Number(release.bundle_size),
          bundleType: release.bundle_type || 'js-bundle',
          patchFromVersion: release.patch_from_version,
          isPatch: Boolean(release.patch_from_version && release.patch_from_version === (currentVersion as string)),
          releaseNotes: release.release_notes || '',
          isMandatory: true,
          minAppVersion: release.min_app_version,
        },
        message: 'Rollback required',
        timestamp: new Date().toISOString(),
      });
    }

    // Check rollout percentage (gradual rollout)
    if (release.rollout_percentage < 100) {
      // B3 rollout bucketing: prefer accountId, fallback to deviceId.
      // If no stable key is provided, do not allow update under rollout < 100
      // to avoid uncontrolled rollout.
      if (!rolloutKey) {
        return res.json({
          success: true,
          data: {
            action: 'none' as OTAAction,
            updateAvailable: false,
            currentVersion: currentVersion as string,
            latestVersion: currentVersion as string,
          },
          message: 'Rollout key missing (accountId/deviceId required for gradual rollout)',
          timestamp: new Date().toISOString(),
        });
      }

      const isEligible = isDeviceEligibleForRollout(rolloutKey, release.rollout_percentage);

      if (!isEligible) {
        // Device not in rollout group, return no update
        return res.json({
          success: true,
          data: {
            action: 'none' as OTAAction,
            updateAvailable: false,
            currentVersion: currentVersion as string,
            latestVersion: currentVersion as string,
          },
          message: 'Device not in rollout group',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Upsert device if deviceId provided
    if (deviceId) {
      await Device.upsert({
        application_id: application.id,
        device_id: deviceId,
        platform: platform as 'ios' | 'android',
        app_version: currentVersion as string,
        bundle_version: currentVersion as string,
        last_check_at: new Date(),
      });
    }

    const isPatch = Boolean(
      release.patch_from_version && release.patch_from_version === (currentVersion as string)
    );

    const response = {
      success: true,
      data: {
        action: 'update' as OTAAction,
        updateAvailable: true,
        currentVersion: currentVersion as string,
        latestVersion: release.version,
        releaseId: release.id,
        downloadUrl: release.bundle_url,
        bundleHash: release.bundle_hash,
        bundleSize: Number(release.bundle_size),
        bundleType: release.bundle_type || 'js-bundle',
        patchFromVersion: release.patch_from_version,
        isPatch,
        fullDownloadUrl: isPatch ? (release.full_bundle_url || undefined) : undefined,
        fullBundleHash: isPatch ? (release.full_bundle_hash || undefined) : undefined,
        fullBundleSize: isPatch ? (release.full_bundle_size != null ? Number(release.full_bundle_size) : undefined) : undefined,
        releaseNotes: release.release_notes || '',
        isMandatory: release.is_mandatory,
        minAppVersion: release.min_app_version,
      },
      message: 'Update available',
      timestamp: new Date().toISOString(),
    };

    return res.json(response);
  } catch (error: any) {
    console.error('Error in checkUpdate:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
