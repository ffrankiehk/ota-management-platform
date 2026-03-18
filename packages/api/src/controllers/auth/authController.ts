import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Organization } from '../../models';
import { config } from '../../config';

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Find user by email or username
    const user = await User.findOne({
      where: { 
        [require('sequelize').Op.or]: [
          { email },
          { username: email }
        ],
        is_active: true 
      },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password',
        timestamp: new Date().toISOString(),
      });
    }

    const plain: any = user.toJSON();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, plain.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString(),
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: plain.id,
        email: plain.email,
        role: plain.role,
        organizationId: plain.organization_id,
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: plain.id,
          email: plain.email,
          role: plain.role,
          organization: plain.organization
            ? { id: plain.organization.id, name: plain.organization.name, slug: plain.organization.slug }
            : null,
        },
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// GET /api/v1/auth/me
export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
        timestamp: new Date().toISOString(),
      });
    }

    const user = await User.findByPk(userId, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }

    const plain: any = user.toJSON();

    return res.json({
      success: true,
      data: {
        id: plain.id,
        email: plain.email,
        role: plain.role,
        organization: plain.organization
          ? { id: plain.organization.id, name: plain.organization.name, slug: plain.organization.slug }
          : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getMe:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
