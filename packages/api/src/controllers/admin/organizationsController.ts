import { Request, Response } from 'express';
import crypto from 'crypto';
import { Organization, Application, User } from '../../models';

// Generate API Key
const generateApiKey = (): string => {
  return `ota_${crypto.randomBytes(32).toString('hex')}`;
};

// GET /api/v1/admin/organizations
export const listOrganizations = async (req: Request, res: Response) => {
  try {
    const organizations = await Organization.findAll({
      order: [['created_at', 'DESC']],
    });

    const data = await Promise.all(
      organizations.map(async (org: any) => {
        const plain = org.toJSON();
        const appCount = await Application.count({ where: { organization_id: plain.id } });
        const userCount = await User.count({ where: { organization_id: plain.id } });

        return {
          id: plain.id,
          name: plain.name,
          slug: plain.slug,
          apiKey: plain.api_key ? `${plain.api_key.substring(0, 12)}...` : null, // Masked
          appCount,
          userCount,
          createdAt: plain.created_at,
          updatedAt: plain.updated_at,
        };
      })
    );

    return res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in listOrganizations:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// POST /api/v1/admin/organizations
export const createOrganization = async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'name and slug are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if slug already exists
    const existing = await Organization.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Slug already exists',
        timestamp: new Date().toISOString(),
      });
    }

    const apiKey = generateApiKey();

    const organization = await Organization.create({
      name,
      slug,
      api_key: apiKey,
    });

    const plain: any = organization.toJSON();

    return res.status(201).json({
      success: true,
      data: {
        id: plain.id,
        name: plain.name,
        slug: plain.slug,
        apiKey: plain.api_key, // Show full key on creation
        createdAt: plain.created_at,
      },
      message: 'Organization created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in createOrganization:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// PUT /api/v1/admin/organizations/:id
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        timestamp: new Date().toISOString(),
      });
    }

    if (name !== undefined) organization.set('name', name);
    if (slug !== undefined) {
      // Check if new slug already exists
      const existing = await Organization.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        return res.status(409).json({
          success: false,
          message: 'Slug already exists',
          timestamp: new Date().toISOString(),
        });
      }
      organization.set('slug', slug);
    }

    await organization.save();

    const plain: any = organization.toJSON();

    return res.json({
      success: true,
      data: {
        id: plain.id,
        name: plain.name,
        slug: plain.slug,
        updatedAt: plain.updated_at,
      },
      message: 'Organization updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in updateOrganization:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// DELETE /api/v1/admin/organizations/:id
export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if organization has apps or users
    const appCount = await Application.count({ where: { organization_id: id } });
    const userCount = await User.count({ where: { organization_id: id } });

    if (appCount > 0 || userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete organization with ${appCount} apps and ${userCount} users. Delete them first.`,
        timestamp: new Date().toISOString(),
      });
    }

    await organization.destroy();

    return res.json({
      success: true,
      message: 'Organization deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in deleteOrganization:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// POST /api/v1/admin/organizations/:id/regenerate-api-key
export const regenerateApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
        timestamp: new Date().toISOString(),
      });
    }

    const newApiKey = generateApiKey();
    organization.set('api_key', newApiKey);
    await organization.save();

    return res.json({
      success: true,
      data: {
        apiKey: newApiKey, // Show full new key
      },
      message: 'API key regenerated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in regenerateApiKey:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
