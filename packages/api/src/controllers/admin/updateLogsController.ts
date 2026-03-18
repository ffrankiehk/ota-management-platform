import { Request, Response } from 'express';
import { UpdateLog, Release, Application } from '../../models';
import { Op } from 'sequelize';

// GET /api/v1/admin/update-logs
export const listUpdateLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, applicationId, status, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        where.created_at[Op.lte] = new Date(endDate as string);
      }
    }

    // Build include with application filter
    const includeOptions: any[] = [
      {
        model: Release,
        as: 'release',
        attributes: ['id', 'version'],
        include: [
          {
            model: Application,
            as: 'application',
            attributes: ['id', 'name', 'bundle_id'],
            ...(applicationId && { where: { id: applicationId } }),
          },
        ],
        ...(applicationId && { required: true }),
      },
    ];

    const { count, rows } = await UpdateLog.findAndCountAll({
      where,
      include: includeOptions,
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const data = rows.map((log) => {
      const plain: any = log.toJSON();
      return {
        id: plain.id,
        deviceId: plain.device_id,
        status: plain.status,
        errorMessage: plain.error_message,
        downloadTimeMs: plain.download_time_ms,
        installTimeMs: plain.install_time_ms,
        deviceInfo: plain.device_info,
        installedAt: plain.installed_at,
        createdAt: plain.created_at,
        release: plain.release
          ? {
              id: plain.release.id,
              version: plain.release.version,
              application: plain.release.application
                ? {
                    id: plain.release.application.id,
                    name: plain.release.application.name,
                    bundleId: plain.release.application.bundle_id,
                  }
                : null,
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
    console.error('Error in listUpdateLogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};

// GET /api/v1/admin/update-logs/stats
export const getUpdateStats = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Get counts by status
    const logs = await UpdateLog.findAll({
      where: {
        created_at: { [Op.gte]: startDate },
      },
      attributes: ['status', 'created_at'],
    });

    const total = logs.length;
    const successful = logs.filter((l: any) => l.status === 'installed').length;
    const failed = logs.filter((l: any) => l.status === 'failed').length;
    const pending = logs.filter((l: any) => l.status === 'started').length;
    const downloading = logs.filter((l: any) => l.status === 'downloaded' || l.status === 'verified').length;
    const completedTotal = successful + failed;

    // Group by day
    const dailyStats: Record<string, { success: number; failed: number; total: number }> = {};
    logs.forEach((log: any) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { success: 0, failed: 0, total: 0 };
      }
      dailyStats[date].total++;
      if (log.status === 'installed') dailyStats[date].success++;
      if (log.status === 'failed') dailyStats[date].failed++;
    });

    return res.json({
      success: true,
      data: {
        summary: {
          total,
          successful,
          failed,
          pending,
          downloading,
          successRate: completedTotal > 0 ? Math.round((successful / completedTotal) * 100) : 0,
        },
        daily: Object.entries(dailyStats)
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getUpdateStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
