/**
 * OTA Client for React Native
 * Main class for managing over-the-air updates
 */

import {
  OTAConfig,
  UpdateInfo,
  CheckUpdateResponse,
  DownloadProgress,
  DownloadResult,
  ReportStatusPayload,
  OTAClientOptions,
  UpdateResult,
  UpdateStatus,
} from './types';
import { verifyFileHash } from './utils/crypto';
import {
  ensureOTADirectory,
  getBundlePath,
  cleanupOldBundles,
  fileExists,
} from './utils/storage';

const RNFS = require('react-native-fs');

export class OTAClient {
  private config: OTAConfig;
  private options: OTAClientOptions;

  constructor(config: OTAConfig, options: OTAClientOptions = {}) {
    this.config = {
      timeout: 30000,
      ...config,
    };
    this.options = {
      verifyHash: true,
      ...options,
    };
  }

  /**
   * Check for available updates
   */
  async checkForUpdate(): Promise<UpdateInfo> {
    try {
      const url = `${this.config.apiUrl}/api/v1/ota/check-update`;
      
      const params = {
        bundleId: this.config.bundleId,
        platform: this.config.platform,
        currentVersion: this.config.currentVersion,
        deviceId: this.config.deviceId,
        accountId: this.config.accountId,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CheckUpdateResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to check for updates');
      }

      return data.data;
    } catch (error: any) {
      throw new Error(`Failed to check for updates: ${error.message}`);
    }
  }

  /**
   * Download update bundle with progress tracking
   */
  async downloadUpdate(updateInfo: UpdateInfo): Promise<DownloadResult> {
    if (!updateInfo.downloadUrl || !updateInfo.releaseId) {
      throw new Error('Invalid update info: missing downloadUrl or releaseId');
    }

    try {
      // Ensure OTA directory exists
      await ensureOTADirectory();

      // Report download started
      if (this.options.onStatusChange) {
        this.options.onStatusChange('downloading');
      }

      await this.reportStatus({
        bundleId: this.config.bundleId,
        platform: this.config.platform,
        deviceId: this.config.deviceId,
        releaseId: updateInfo.releaseId,
        status: 'downloading',
        currentVersion: this.config.currentVersion,
        targetVersion: updateInfo.latestVersion,
      });

      // Determine file path
      const fileName = updateInfo.isPatch ? 'patch.bundle' : 'bundle.js';
      const filePath = getBundlePath(updateInfo.releaseId, fileName);

      // Check if file already exists
      const exists = await fileExists(filePath);
      if (exists) {
        // Verify existing file
        if (updateInfo.bundleHash && this.options.verifyHash) {
          const isValid = await verifyFileHash(filePath, updateInfo.bundleHash);
          if (isValid) {
            // File already downloaded and verified
            if (this.options.onStatusChange) {
              this.options.onStatusChange('downloaded');
            }
            return {
              filePath,
              bundleHash: updateInfo.bundleHash,
            };
          }
        }
      }

      // Download file with progress tracking
      const downloadResult = RNFS.downloadFile({
        fromUrl: updateInfo.downloadUrl,
        toFile: filePath,
        progressDivider: 10,
        begin: (res: any) => {
          console.log('Download started:', res);
        },
        progress: (res: any) => {
          if (this.options.onProgress) {
            this.options.onProgress({
              bytesWritten: res.bytesWritten,
              contentLength: res.contentLength,
              progress: res.bytesWritten / res.contentLength,
            });
          }
        },
      });

      const result = await downloadResult.promise;

      if (result.statusCode !== 200) {
        throw new Error(`Download failed with status ${result.statusCode}`);
      }

      // Report download completed
      if (this.options.onStatusChange) {
        this.options.onStatusChange('downloaded');
      }

      await this.reportStatus({
        bundleId: this.config.bundleId,
        platform: this.config.platform,
        deviceId: this.config.deviceId,
        releaseId: updateInfo.releaseId,
        status: 'downloaded',
        currentVersion: this.config.currentVersion,
        targetVersion: updateInfo.latestVersion,
      });

      return {
        filePath,
        bundleHash: updateInfo.bundleHash || '',
      };
    } catch (error: any) {
      // Report download failed
      await this.reportStatus({
        bundleId: this.config.bundleId,
        platform: this.config.platform,
        deviceId: this.config.deviceId,
        releaseId: updateInfo.releaseId!,
        status: 'failed',
        currentVersion: this.config.currentVersion,
        targetVersion: updateInfo.latestVersion,
        errorMessage: error.message,
      });

      throw new Error(`Failed to download update: ${error.message}`);
    }
  }

  /**
   * Verify downloaded bundle integrity
   */
  async verifyBundle(downloadResult: DownloadResult): Promise<boolean> {
    if (!this.options.verifyHash) {
      return true;
    }

    if (!downloadResult.bundleHash) {
      console.warn('No bundle hash provided, skipping verification');
      return true;
    }

    try {
      if (this.options.onStatusChange) {
        this.options.onStatusChange('verifying');
      }

      const isValid = await verifyFileHash(
        downloadResult.filePath,
        downloadResult.bundleHash
      );

      if (this.options.onStatusChange) {
        this.options.onStatusChange(isValid ? 'verified' : 'failed');
      }

      return isValid;
    } catch (error: any) {
      console.error('Bundle verification failed:', error);
      if (this.options.onStatusChange) {
        this.options.onStatusChange('failed');
      }
      return false;
    }
  }

  /**
   * Report update status to server
   */
  async reportStatus(payload: ReportStatusPayload): Promise<void> {
    try {
      const url = `${this.config.apiUrl}/api/v1/ota/report-status`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`Failed to report status: HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.warn('Failed to report status:', error.message);
    }
  }

  /**
   * Complete update flow: check, download, verify
   */
  async performUpdate(): Promise<UpdateResult> {
    try {
      // Step 1: Check for updates
      const updateInfo = await this.checkForUpdate();

      if (!updateInfo.updateAvailable || updateInfo.action === 'none') {
        return {
          success: true,
          message: 'No update available',
          updateInfo,
        };
      }

      // Step 2: Download update
      const downloadResult = await this.downloadUpdate(updateInfo);

      // Step 3: Verify bundle
      const isValid = await this.verifyBundle(downloadResult);

      if (!isValid) {
        throw new Error('Bundle verification failed');
      }

      // Step 4: Report success
      await this.reportStatus({
        bundleId: this.config.bundleId,
        platform: this.config.platform,
        deviceId: this.config.deviceId,
        releaseId: updateInfo.releaseId!,
        status: 'installed',
        currentVersion: this.config.currentVersion,
        targetVersion: updateInfo.latestVersion,
      });

      // Step 5: Cleanup old bundles
      await cleanupOldBundles(3);

      return {
        success: true,
        message: 'Update completed successfully',
        updateInfo,
        filePath: downloadResult.filePath,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error,
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OTAConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): OTAConfig {
    return { ...this.config };
  }
}
