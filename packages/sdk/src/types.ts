/**
 * OTA SDK Configuration
 */
export interface OTAConfig {
  /** Base URL of the OTA API server */
  apiUrl: string;
  /** Application bundle ID (e.g., com.company.app) */
  bundleId: string;
  /** Platform: 'ios' | 'android' */
  platform: 'ios' | 'android';
  /** Current app version (e.g., '1.0.0') */
  appVersion: string;
  /** Current bundle version (e.g., '1.0.0') */
  currentBundleVersion: string;
  /** Optional: Device unique identifier */
  deviceId?: string;
  accountId?: string;
  /** Optional: Check interval in milliseconds (default: 1 hour) */
  checkInterval?: number;
  /** Optional: Auto-check on app start (default: true) */
  autoCheck?: boolean;
  /** Optional: Enable status reporting (default: true) */
  enableReporting?: boolean;
}

/**
 * Update information returned from the API
 */
export interface UpdateInfo {
  action?: 'none' | 'update' | 'rollback';
  updateAvailable?: boolean;
  currentVersion?: string;
  latestVersion?: string;
  releaseId?: string;
  downloadUrl?: string;
  bundleHash?: string;
  bundleSize?: number;
  bundleType?: string;
  patchFromVersion?: string | null;
  isPatch?: boolean;
  fullDownloadUrl?: string;
  fullBundleHash?: string;
  fullBundleSize?: number;
  releaseNotes?: string;
  isMandatory?: boolean;
  minAppVersion?: string | null;
  available: boolean;
  version?: string;
  bundleUrl?: string;
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
}

/**
 * OTA Update state
 */
export type OTAState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'verifying'
  | 'ready'
  | 'error';

/**
 * OTA Error
 */
export interface OTAError {
  code: string;
  message: string;
}

/**
 * Check update request parameters
 */
export interface CheckUpdateParams {
  bundleId: string;
  platform: 'ios' | 'android';
  currentVersion: string;
  appVersion: string;
  deviceId?: string;
  accountId?: string;
}

/**
 * Check update API response
 */
export interface CheckUpdateResponse {
  success: boolean;
  data?: {
    action?: 'none' | 'update' | 'rollback';
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion?: string;
    releaseId?: string;
    downloadUrl?: string;
    bundleHash?: string;
    bundleSize?: number;
    bundleType?: string;
    patchFromVersion?: string | null;
    isPatch?: boolean;
    fullDownloadUrl?: string;
    fullBundleHash?: string;
    fullBundleSize?: number;
    releaseNotes?: string;
    isMandatory?: boolean;
    minAppVersion?: string | null;
  };
  message?: string;
}

/**
 * Status report payload
 */
export interface StatusReportPayload {
  deviceId: string;
  releaseId?: string;
  status: 'started' | 'downloaded' | 'verified' | 'installed' | 'failed';
  errorMessage?: string;
  downloadTimeMs?: number;
  installTimeMs?: number;
  deviceInfo?: {
    platform: string;
    osVersion?: string;
    appVersion?: string;
    [key: string]: any;
  };
}
