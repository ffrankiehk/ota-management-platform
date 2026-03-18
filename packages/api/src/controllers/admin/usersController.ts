import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Organization } from '../../models';

// GET /api/v1/admin/users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });

    const data = users.map((user: any) => {
      const plain: any = user.toJSON();
      return {
        id: plain.id,
        email: plain.email,
        role: plain.role,
        isActive: plain.is_active,
        createdAt: plain.created_at,
        updatedAt: plain.updated_at,
        organization: plain.organization
          ? { id: plain.organization.id, name: plain.organization.name, slug: plain.organization.slug }
          : null,
      };
    });

    return res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in listUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// POST /api/v1/admin/users
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role = 'viewer', organizationId, isActive = true } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'username, email and password are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
        timestamp: new Date().toISOString(),
      });
    }

    // Get organization
    let orgId = organizationId;
    if (!orgId) {
      const org = await Organization.findOne();
      if (org) orgId = org.id;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password_hash: passwordHash,
      role,
      organization_id: orgId,
      is_active: isActive,
    });

    const plain: any = user.toJSON();

    return res.status(201).json({
      success: true,
      data: {
        id: plain.id,
        email: plain.email,
        role: plain.role,
        isActive: plain.is_active,
        createdAt: plain.created_at,
      },
      message: 'User created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in createUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// PUT /api/v1/admin/users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, role, organizationId, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    if (email !== undefined) user.set('email', email);
    if (role !== undefined) user.set('role', role);
    if (organizationId !== undefined) user.set('organization_id', organizationId);
    if (isActive !== undefined) user.set('is_active', isActive);

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      user.set('password_hash', passwordHash);
    }

    await user.save();

    const plain: any = user.toJSON();

    return res.json({
      success: true,
      data: {
        id: plain.id,
        email: plain.email,
        role: plain.role,
        isActive: plain.is_active,
        updatedAt: plain.updated_at,
      },
      message: 'User updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in updateUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// DELETE /api/v1/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    await user.destroy();

    return res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in deleteUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
