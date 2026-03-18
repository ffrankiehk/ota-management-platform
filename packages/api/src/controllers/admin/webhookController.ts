import { Request, Response } from 'express';
import axios from 'axios';

/**
 * Webhook event types
 */
export enum WebhookEvent {
  RELEASE_CREATED = 'release.created',
  RELEASE_ACTIVATED = 'release.activated',
  RELEASE_PAUSED = 'release.paused',
  ROLLBACK_TRIGGERED = 'rollback.triggered',
  UPDATE_FAILED_THRESHOLD = 'update.failed_threshold',
  UPDATE_SUCCESS_MILESTONE = 'update.success_milestone',
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

/**
 * Send webhook notification
 */
export const sendWebhook = async (
  webhookUrl: string,
  event: WebhookEvent,
  data: any
): Promise<boolean> => {
  try {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OTA-Platform-Webhook/1.0',
      },
      timeout: 10000, // 10 seconds
    });

    console.log(`Webhook sent successfully: ${event}`, {
      status: response.status,
      url: webhookUrl,
    });

    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('Webhook send error:', error);
    return false;
  }
};

/**
 * Test webhook endpoint
 */
export const testWebhook = async (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required',
      });
    }

    const success = await sendWebhook(
      webhookUrl,
      WebhookEvent.RELEASE_CREATED,
      {
        test: true,
        message: 'This is a test webhook from OTA Platform',
      }
    );

    return res.json({
      success,
      message: success
        ? 'Webhook test successful'
        : 'Webhook test failed - check URL and server logs',
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to test webhook',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Trigger webhook for release events
 */
export const triggerReleaseWebhook = async (
  webhookUrl: string,
  event: WebhookEvent,
  releaseData: any
) => {
  if (!webhookUrl) return;

  await sendWebhook(webhookUrl, event, {
    release: {
      id: releaseData.id,
      version: releaseData.version,
      applicationId: releaseData.application_id,
      status: releaseData.status,
      rolloutPercentage: releaseData.rollout_percentage,
      isMandatory: releaseData.is_mandatory,
      releasedAt: releaseData.released_at,
    },
  });
};

/**
 * Trigger webhook for rollback events
 */
export const triggerRollbackWebhook = async (
  webhookUrl: string,
  rollbackData: {
    pausedRelease: any;
    activatedRelease: any;
    reason: string;
    stats?: any;
  }
) => {
  if (!webhookUrl) return;

  await sendWebhook(webhookUrl, WebhookEvent.ROLLBACK_TRIGGERED, rollbackData);
};

/**
 * Trigger webhook for update failure threshold
 */
export const triggerFailureThresholdWebhook = async (
  webhookUrl: string,
  failureData: {
    releaseId: string;
    version: string;
    failureRate: number;
    totalUpdates: number;
    failedUpdates: number;
  }
) => {
  if (!webhookUrl) return;

  await sendWebhook(
    webhookUrl,
    WebhookEvent.UPDATE_FAILED_THRESHOLD,
    failureData
  );
};
