import { Request, Response } from 'express';
import { Application, Release } from '../../models';

// GET /api/v1/ota/config
// Query params: bundleId, platform
export const getConfig = async (req: Request, res: Response) => {
  try {
    const bundleId = (req.query.bundleId as string) || (req.query.bundle_id as string);
    const platform = (req.query.platform as string) || 'both';

    if (!bundleId) {
      return res.status(400).json({
        success: false,
        message: 'bundleId is required',
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

    const latestRelease = await Release.findOne({
      where: {
        application_id: application.id,
        status: 'active',
      },
      order: [['created_at', 'DESC']],
    });

    const bundleVersion = latestRelease?.version || '1.0.0';

    return res.json({
      success: true,
      data: {
        bundleVersion,
        nativeVersion: bundleVersion,
        checkIntervalSeconds: 24 * 60 * 60,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getConfig:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
