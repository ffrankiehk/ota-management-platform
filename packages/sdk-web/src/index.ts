/**
 * OTA Platform Web SDK
 * For Progressive Web Apps (PWA) and Single Page Applications (SPA)
 */

export interface OTAConfig {
  apiBaseUrl: string;
  bundleId: string;
  platform?: string;
  currentVersion: string;
  deviceId: string;
  timeoutSeconds?: number;
  enableLogging?: boolean;
}

export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseId: string;
  downloadUrl: string;
  bundleHash: string;
  bundleSize: number;
  releaseNotes: string;
  isMandatory: boolean;
  minAppVersion?: string;
}

export enum UpdateStatus {
  STARTED = 'started',
  DOWNLOADED = 'downloaded',
  VERIFIED = 'verified',
  INSTALLED = 'installed',
  FAILED = 'failed',
}

export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  progress: number;
}

export class OTAError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'OTAError';
  }
}

export class OTAClient {
  private config: OTAConfig;

  constructor(config: OTAConfig) {
    this.config = {
      platform: 'web',
      timeoutSeconds: 30,
      enableLogging: false,
      ...config,
    };
  }

  /**
   * Check for available updates
   */
  async checkForUpdate(): Promise<UpdateInfo> {
    this.log('Checking for updates...');

    try {
      const url = new URL(`${this.config.apiBaseUrl}/api/v1/ota/check-update`);
      url.searchParams.set('bundleId', this.config.bundleId);
      url.searchParams.set('platform', this.config.platform!);
      url.searchParams.set('currentVersion', this.config.currentVersion);
      url.searchParams.set('deviceId', this.config.deviceId);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeoutSeconds! * 1000
      );

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new OTAError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new OTAError(result.message || 'Check update failed');
      }

      const updateInfo = result.data as UpdateInfo;

      if (updateInfo.updateAvailable) {
        this.log(`Update available: ${updateInfo.latestVersion}`);
      } else {
        this.log('No update available');
      }

      return updateInfo;
    } catch (error) {
      this.logError('Check update error:', error);
      if (error instanceof OTAError) throw error;
      throw new OTAError('Check update failed', error as Error);
    }
  }

  /**
   * Download update bundle with progress tracking
   */
  async downloadUpdate(
    updateInfo: UpdateInfo,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<Blob> {
    this.log(`Downloading update from ${updateInfo.downloadUrl}`);

    try {
      // Report download started
      await this.reportStatus(updateInfo.releaseId, UpdateStatus.STARTED);

      const response = await fetch(updateInfo.downloadUrl);

      if (!response.ok) {
        throw new OTAError(`HTTP ${response.status}: Download failed`);
      }

      const contentLength = parseInt(
        response.headers.get('content-length') || String(updateInfo.bundleSize)
      );

      if (!response.body) {
        throw new OTAError('Response body is null');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytesDownloaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        bytesDownloaded += value.length;

        if (onProgress) {
          const progress = bytesDownloaded / contentLength;
          onProgress({
            bytesDownloaded,
            totalBytes: contentLength,
            progress: Math.min(progress, 1),
          });
        }
      }

      const blob = new Blob(chunks);
      this.log('Download complete');

      // Report downloaded
      await this.reportStatus(updateInfo.releaseId, UpdateStatus.DOWNLOADED);

      return blob;
    } catch (error) {
      this.logError('Download error:', error);

      // Report failed
      await this.reportStatus(
        updateInfo.releaseId,
        UpdateStatus.FAILED,
        error instanceof Error ? error.message : String(error)
      );

      if (error instanceof OTAError) throw error;
      throw new OTAError('Download failed', error as Error);
    }
  }

  /**
   * Verify bundle integrity using SHA256 hash
   */
  async verifyBundle(blob: Blob, expectedHash: string): Promise<boolean> {
    this.log('Verifying bundle...');

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const isValid = hashHex.toLowerCase() === expectedHash.toLowerCase();

      this.log(`Bundle hash: ${hashHex}`);
      this.log(`Expected hash: ${expectedHash}`);
      this.log(`Verification: ${isValid ? 'PASSED' : 'FAILED'}`);

      return isValid;
    } catch (error) {
      this.logError('Verification error:', error);
      return false;
    }
  }

  /**
   * Report update status to server
   */
  async reportStatus(
    releaseId: string,
    status: UpdateStatus,
    errorMessage?: string,
    downloadTimeMs?: number,
    installTimeMs?: number
  ): Promise<void> {
    this.log(`Reporting status: ${status}`);

    try {
      const deviceInfo = this.getDeviceInfo();

      const response = await fetch(
        `${this.config.apiBaseUrl}/api/v1/ota/report-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: this.config.deviceId,
            releaseId,
            status,
            errorMessage,
            downloadTimeMs,
            installTimeMs,
            deviceInfo,
          }),
        }
      );

      if (!response.ok) {
        throw new OTAError(`HTTP ${response.status}: Report status failed`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new OTAError(result.message || 'Report status failed');
      }

      this.log(`Status reported successfully: ${status}`);
    } catch (error) {
      this.logError('Report status error:', error);
      if (error instanceof OTAError) throw error;
      throw new OTAError('Report status failed', error as Error);
    }
  }

  /**
   * Install update (for PWA/SPA)
   * This will cache the new bundle in Service Worker
   */
  async installUpdate(blob: Blob, updateInfo: UpdateInfo): Promise<void> {
    this.log('Installing update...');

    try {
      // Store update in Cache Storage
      const cache = await caches.open('ota-updates');
      const response = new Response(blob);
      await cache.put(
        `/ota-bundle-${updateInfo.latestVersion}`,
        response
      );

      // Store metadata
      localStorage.setItem(
        'ota-current-version',
        updateInfo.latestVersion
      );
      localStorage.setItem(
        'ota-bundle-hash',
        updateInfo.bundleHash
      );

      this.log('Bundle installed successfully');
    } catch (error) {
      this.logError('Install error:', error);
      if (error instanceof OTAError) throw error;
      throw new OTAError('Install failed', error as Error);
    }
  }

  /**
   * Reload page to apply update
   */
  reloadApp(): void {
    window.location.reload();
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    return {
      manufacturer: navigator.vendor || 'Unknown',
      model: navigator.userAgent,
      osVersion: navigator.platform,
      appVersion: this.config.currentVersion,
    };
  }

  /**
   * Log message if logging is enabled
   */
  private log(...args: unknown[]): void {
    if (this.config.enableLogging) {
      console.log('[OTA]', ...args);
    }
  }

  /**
   * Log error message if logging is enabled
   */
  private logError(...args: unknown[]): void {
    if (this.config.enableLogging) {
      console.error('[OTA ERROR]', ...args);
    }
  }
}

export default OTAClient;
