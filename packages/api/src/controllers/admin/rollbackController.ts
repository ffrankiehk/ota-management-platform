import { Request, Response } from 'express';
import { Release, UpdateLog } from '../../models';
import { Op } from 'sequelize';

/**
 * Monitor release health and trigger auto-rollback if needed
 */
export const monitorReleaseHealth = async (req: Request, res: Response) => {
  try {
    const { releaseId } = req.params;

    const release = await Release.findByPk(releaseId);
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found',
      });
    }

    // Get update logs for this release in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const logs = await UpdateLog.findAll({
      where: {
        release_id: releaseId,
        created_at: {
          [Op.gte]: oneDayAgo,
        },
      },
    });

    const totalUpdates = logs.length;
    const failedUpdates = logs.filter(log => log.status === 'failed').length;
    const installedUpdates = logs.filter(log => log.status === 'installed').length;
    
    const failureRate = totalUpdates > 0 ? (failedUpdates / totalUpdates) * 100 : 0;
    const successRate = totalUpdates > 0 ? (installedUpdates / totalUpdates) * 100 : 0;

    // Auto-rollback thresholds
    const FAILURE_RATE_THRESHOLD = 30; // 30% failure rate
    const MIN_SAMPLES = 10; // Minimum samples before triggering auto-rollback

    const shouldRollback = 
      totalUpdates >= MIN_SAMPLES && 
      failureRate >= FAILURE_RATE_THRESHOLD;

    if (shouldRollback && release.status === 'active') {
      // Pause the release
      await release.update({ status: 'paused' });

      return res.json({
        success: true,
        data: {
          releaseId,
          action: 'auto_rollback',
          reason: `High failure rate: ${failureRate.toFixed(2)}%`,
          stats: {
            totalUpdates,
            failedUpdates,
            installedUpdates,
            failureRate: failureRate.toFixed(2),
            successRate: successRate.toFixed(2),
          },
        },
        message: 'Release automatically paused due to high failure rate',
      });
    }

    return res.json({
      success: true,
      data: {
        releaseId,
        status: release.status,
        stats: {
          totalUpdates,
          failedUpdates,
          installedUpdates,
          failureRate: failureRate.toFixed(2),
          successRate: successRate.toFixed(2),
        },
        healthy: !shouldRollback,
      },
      message: 'Release health check complete',
    });
  } catch (error) {
    console.error('Monitor release health error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to monitor release health',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Manually rollback a release
 */
export const rollbackRelease = async (req: Request, res: Response) => {
  try {
    const { releaseId } = req.params;
    const { reason } = req.body;

    const release = await Release.findByPk(releaseId);
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found',
      });
    }

    // Pause the current release
    await release.update({ status: 'paused' });

    // Find previous active release
    const previousRelease = await Release.findOne({
      where: {
        application_id: release.application_id,
        id: { [Op.ne]: releaseId },
        status: { [Op.in]: ['paused', 'archived'] },
      },
      order: [['created_at', 'DESC']],
    });

    if (previousRelease) {
      // Reactivate previous release
      await previousRelease.update({ status: 'active' });
    }

    return res.json({
      success: true,
      data: {
        pausedRelease: {
          id: release.id,
          version: release.version,
          status: 'paused',
        },
        activatedRelease: previousRelease ? {
          id: previousRelease.id,
          version: previousRelease.version,
          status: 'active',
        } : null,
        reason,
      },
      message: 'Release rolled back successfully',
    });
  } catch (error) {
    console.error('Rollback release error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to rollback release',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get rollback history for an application
 */
export const getRollbackHistory = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    // Get all paused/archived releases for this application
    const releases = await Release.findAll({
      where: {
        application_id: applicationId,
        status: { [Op.in]: ['paused', 'archived'] },
      },
      order: [['updated_at', 'DESC']],
      limit: 20,
    });

    return res.json({
      success: true,
      data: releases.map(r => ({
        id: r.id,
        version: r.version,
        status: r.status,
        rolloutPercentage: r.rollout_percentage,
        releasedAt: r.released_at,
        updatedAt: r.updated_at,
      })),
      message: 'Rollback history retrieved successfully',
    });
  } catch (error) {
    console.error('Get rollback history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get rollback history',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
