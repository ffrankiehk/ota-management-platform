import { Request, Response } from 'express';
import { Device, Application, UpdateLog, Release } from '../../models';
import { Op, literal } from 'sequelize';

// GET /api/v1/admin/devices
export const listDevices = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, applicationId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (applicationId) {
      where.application_id = applicationId;
    }

    const { count, rows } = await Device.findAndCountAll({
      where,
      include: [
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'name', 'bundle_id', 'platform'],
        },
      ],
      order: [['last_check_at', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const deviceIds: number[] = rows
      .map((d: any) => d?.id)
      .filter((v: any) => typeof v === 'number');

    const latestLogByDeviceId = new Map<
      number,
      { status: string; createdAt: Date; releaseVersion: string | null }
    >();

    if (deviceIds.length > 0) {
      const logs = await UpdateLog.findAll({
        where: {
          device_id: { [Op.in]: deviceIds },
        },
        include: [
          {
            model: Release,
            as: 'release',
            attributes: ['id', 'version'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      for (const log of logs as any[]) {
        const plain: any = log.toJSON();
        const key = plain.device_id as number;
        if (!latestLogByDeviceId.has(key)) {
          latestLogByDeviceId.set(key, {
            status: plain.status,
            createdAt: plain.created_at,
            releaseVersion: plain.release?.version ?? null,
          });
        }
      }
    }

    const data = rows.map((device: any) => {
      const plain = device.toJSON();
      const latest = latestLogByDeviceId.get(plain.id);
      return {
        id: plain.id,
        deviceId: plain.device_id,
        platform: plain.platform,
        osVersion: null, // Not tracked in current model
        appVersion: plain.app_version,
        bundleVersion: plain.bundle_version,
        lastSeenAt: plain.last_check_at,
        lastUpdateStatus: latest?.status ?? null,
        lastUpdateAt: latest?.createdAt ?? null,
        lastReleaseVersion: latest?.releaseVersion ?? null,
        createdAt: plain.created_at,
        application: plain.application
          ? {
              id: plain.application.id,
              name: plain.application.name,
              bundleId: plain.application.bundle_id,
              platform: plain.application.platform,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      data,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in listDevices:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// GET /api/v1/admin/devices/:id
export const getDeviceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id, {
      include: [
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'name', 'bundle_id', 'platform'],
        },
      ],
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
        timestamp: new Date().toISOString(),
      });
    }

    const plain: any = device.toJSON();

    return res.json({
      success: true,
      data: {
        id: plain.id,
        deviceId: plain.device_id,
        platform: plain.platform,
        osVersion: null,
        appVersion: plain.app_version,
        bundleVersion: plain.bundle_version,
        lastSeenAt: plain.last_check_at,
        createdAt: plain.created_at,
        updatedAt: plain.updated_at,
        application: plain.application
          ? {
              id: plain.application.id,
              name: plain.application.name,
              bundleId: plain.application.bundle_id,
              platform: plain.application.platform,
            }
          : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getDeviceById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// DELETE /api/v1/admin/devices/:id
export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const device = await Device.findByPk(id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
        timestamp: new Date().toISOString(),
      });
    }

    await device.destroy();

    return res.json({
      success: true,
      message: 'Device deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in deleteDevice:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
