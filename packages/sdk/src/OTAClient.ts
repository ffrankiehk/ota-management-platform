import {
  OTAConfig,
  UpdateInfo,
  DownloadProgress,
  CheckUpdateParams,
  CheckUpdateResponse,
  StatusReportPayload,
} from './types';

/**
 * OTA Client - Core class for handling OTA updates
 */
export class OTAClient {
  private config: OTAConfig;
  private abortController: AbortController | null = null;

  constructor(config: OTAConfig) {
    this.config = config;
  }

  /**
   * Check for available updates
   */
  async checkForUpdate(): Promise<UpdateInfo> {
    const params: CheckUpdateParams = {
      bundleId: this.config.bundleId,
      platform: this.config.platform,
      currentVersion: this.config.currentBundleVersion,
      appVersion: this.config.appVersion,
      deviceId: this.config.deviceId,
      accountId: this.config.accountId,
    };

    const queryString = new URLSearchParams({
      bundleId: params.bundleId,
      platform: params.platform,
      currentVersion: params.currentVersion,
      appVersion: params.appVersion,
      ...(params.deviceId && { deviceId: params.deviceId }),
      ...(params.accountId && { accountId: params.accountId }),
    }).toString();

    const url = `${this.config.apiUrl}/api/v1/ota/check-update?${queryString}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = (await response.json()) as CheckUpdateResponse;

      if (!data.success || !data.data) {
        return { available: false };
      }

      const {
        action,
        updateAvailable,
        currentVersion,
        latestVersion,
        releaseId,
        downloadUrl,
        bundleHash,
        bundleSize,
        bundleType,
        patchFromVersion,
        isPatch,
        fullDownloadUrl,
        fullBundleHash,
        fullBundleSize,
        releaseNotes,
        isMandatory,
        minAppVersion,
      } = data.data;

      const resolvedAction: UpdateInfo['action'] = action ?? (updateAvailable ? 'update' : 'none');
      const resolvedAvailable = resolvedAction === 'update' || resolvedAction === 'rollback';

      return {
        action: resolvedAction,
        updateAvailable,
        currentVersion,
        latestVersion,
        releaseId,
        downloadUrl,
        bundleHash,
        bundleSize,
        bundleType,
        patchFromVersion,
        isPatch,
        fullDownloadUrl,
        fullBundleHash,
        fullBundleSize,
        releaseNotes,
        isMandatory,
        minAppVersion,

        available: resolvedAvailable,
        version: latestVersion,
        bundleUrl: downloadUrl,
      };
    } catch (error) {
      console.error('[OTA] Check update error:', error);
      throw error;
    }
  }

  /**
   * Download bundle file
   * @param url Bundle URL
   * @param onProgress Progress callback
   * @returns ArrayBuffer of the downloaded bundle
   */
  async downloadBundle(
    url: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<ArrayBuffer> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(url, {
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytesDownloaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        bytesDownloaded += value.length;

        if (onProgress && totalBytes > 0) {
          onProgress({
            bytesDownloaded,
            totalBytes,
            percent: Math.round((bytesDownloaded / totalBytes) * 100),
          });
        }
      }

      // Combine chunks into single ArrayBuffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result.buffer;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Download cancelled');
      }
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing download
   */
  cancelDownload(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Verify bundle hash (SHA256)
   * Note: This is a simplified version. In production, use a proper crypto library.
   */
  async verifyHash(data: ArrayBuffer, expectedHash: string): Promise<boolean> {
    try {
      // Use SubtleCrypto if available (Web/React Native with expo-crypto)
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex === expectedHash.toLowerCase();
      }

      // Fallback: Skip verification if crypto not available
      console.warn('[OTA] Crypto not available, skipping hash verification');
      return true;
    } catch (error) {
      console.error('[OTA] Hash verification error:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): OTAConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<OTAConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Report update status to the server
   */
  async reportStatus(payload: StatusReportPayload): Promise<boolean> {
    if (this.config.enableReporting === false) {
      return true; // Skip reporting if disabled
    }

    const url = `${this.config.apiUrl}/api/v1/ota/report-status`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('[OTA] Status report failed:', response.status);
        return false;
      }

      const data = await response.json() as { success: boolean };
      return data.success === true;
    } catch (error) {
      console.error('[OTA] Status report error:', error);
      return false;
    }
  }
}
