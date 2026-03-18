import { Request, Response } from 'express';
import { UpdateLog, Release, Device, Application } from '../../models';

export const reportStatus = async (req: Request, res: Response) => {
  try {
    const body: any = req.body || {};

    const deviceId = body.deviceId ?? body.device_id;
    const releaseId = body.releaseId ?? body.release_id;
    const status = body.status;
    const errorMessage = body.errorMessage ?? body.error_message;
    const downloadTimeMs = body.downloadTimeMs ?? body.download_time_ms;
    const installTimeMs = body.installTimeMs ?? body.install_time_ms;
    const deviceInfo = body.deviceInfo ?? body.device_info;

    if (!deviceId || !releaseId || !status) {
      return res.status(400).json({
        success: false,
        message: 'deviceId, releaseId and status are required',
        timestamp: new Date().toISOString(),
      });
    }

    // Verify release exists and get application
    const release = await Release.findByPk(releaseId, {
      include: [
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'platform'],
        },
      ],
    });
    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found',
        timestamp: new Date().toISOString(),
      });
    }

    const plain: any = release.toJSON();
    const application = plain.application;
    if (!application) {
      return res.status(500).json({
        success: false,
        message: 'Release has no associated application',
        timestamp: new Date().toISOString(),
      });
    }

    // Upsert device record
    const [device] = await Device.upsert({
      application_id: application.id,
      device_id: deviceId,
      platform: application.platform,
      bundle_version: release.version,
      last_update_at: new Date(),
      last_check_at: new Date(),
    });

    // Create update log using device's numeric ID
    const updateLog = await UpdateLog.create({
      device_id: device.id,
      release_id: releaseId,
      status,
      error_message: errorMessage,
      download_time_ms: downloadTimeMs,
      install_time_ms: installTimeMs,
      device_info: deviceInfo,
      installed_at: status === 'installed' ? new Date() : null,
    });

    return res.json({
      success: true,
      data: {
        logId: updateLog.id,
      },
      message: 'Status reported successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in reportStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
