/**
 * OTA SDK Types for React Native
 */

export type Platform = 'ios' | 'android';

export type UpdateAction = 'none' | 'update' | 'rollback';

export type UpdateStatus = 
  | 'started'
  | 'downloading'
  | 'downloaded'
  | 'verifying'
  | 'verified'
  | 'installing'
  | 'installed'
  | 'failed';

export interface OTAConfig {
  apiUrl: string;
  bundleId: string;
  platform: Platform;
  currentVersion: string;
  deviceId?: string;
  accountId?: string;
  timeout?: number;
}

export interface UpdateInfo {
  action: UpdateAction;
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseId?: string;
  downloadUrl?: string;
  bundleHash?: string;
  bundleSize?: number;
  bundleType?: string;
  patchFromVersion?: string;
  isPatch?: boolean;
  fullDownloadUrl?: string;
  fullBundleHash?: string;
  fullBundleSize?: number;
  releaseNotes?: string;
  isMandatory?: boolean;
  minAppVersion?: string;
}

export interface CheckUpdateResponse {
  success: boolean;
  data: UpdateInfo;
  message: string;
  timestamp: string;
}

export interface DownloadProgress {
  bytesWritten: number;
  contentLength: number;
  progress: number;
}

export interface DownloadResult {
  filePath: string;
  bundleHash: string;
}

export interface ReportStatusPayload {
  bundleId: string;
  platform: Platform;
  deviceId?: string;
  releaseId: string;
  status: UpdateStatus;
  currentVersion: string;
  targetVersion: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface OTAClientOptions {
  onProgress?: (progress: DownloadProgress) => void;
  onStatusChange?: (status: UpdateStatus) => void;
  verifyHash?: boolean;
}

export interface UpdateResult {
  success: boolean;
  message: string;
  updateInfo?: UpdateInfo;
  filePath?: string;
  error?: Error;
}
