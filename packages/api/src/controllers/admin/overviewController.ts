import { Request, Response } from 'express';
import { Application, Release, Device, UpdateLog } from '../../models';
import { Op } from 'sequelize';

// GET /api/v1/admin/overview
export const getOverview = async (req: Request, res: Response) => {
  try {
    // Count applications
    const totalApplications = await Application.count();
    const activeApplications = await Application.count({ where: { is_active: true } });

    // Count releases
    const totalReleases = await Release.count();
    const activeReleases = await Release.count({ where: { status: 'active' } });
    const draftReleases = await Release.count({ where: { status: 'draft' } });

    // Count devices
    const totalDevices = await Device.count();

    // Get update logs stats (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await UpdateLog.findAll({
      where: {
        created_at: { [Op.gte]: last24Hours },
      },
      attributes: ['status'],
    });

    const successfulUpdates = recentLogs.filter((log: any) => log.status === 'installed').length;
    const failedUpdates = recentLogs.filter((log: any) => log.status === 'failed').length;
    const totalUpdates = recentLogs.length;
    const completedTotal = successfulUpdates + failedUpdates;
    const successRate = completedTotal > 0 ? Math.round((successfulUpdates / completedTotal) * 100) : 0;

    // Get recent releases (last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReleases = await Release.findAll({
      where: {
        created_at: { [Op.gte]: last7Days },
      },
      include: [
        {
          model: Application,
          as: 'application',
          attributes: ['name', 'bundle_id', 'platform'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    const recentReleasesData = recentReleases.map((r: any) => {
      const plain = r.toJSON();
      return {
        id: plain.id,
        version: plain.version,
        status: plain.status,
        createdAt: plain.created_at,
        application: plain.application
          ? {
              name: plain.application.name,
              bundleId: plain.application.bundle_id,
              platform: plain.application.platform,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      data: {
        applications: {
          total: totalApplications,
          active: activeApplications,
        },
        releases: {
          total: totalReleases,
          active: activeReleases,
          draft: draftReleases,
        },
        devices: {
          total: totalDevices,
        },
        updates: {
          last24Hours: {
            total: totalUpdates,
            successful: successfulUpdates,
            failed: failedUpdates,
            successRate,
          },
        },
        recentReleases: recentReleasesData,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getOverview:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
