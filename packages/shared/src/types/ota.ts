import { Platform } from './common';

// OTA SDK Configuration
export interface OTAConfig {
  apiUrl: string;
  apiKey: string;
  bundleId: string;
  platform?: Platform;
  checkInterval?: number;
  autoDownload?: boolean;
  autoInstall?: boolean;
  enableLogging?: boolean;
}

// Update Information
export interface UpdateInfo {
  version: string;
  bundleUrl: string;
  bundleHash: string;
  bundleSize: number;
  isMandatory: boolean;
  releaseNotes: string;
}

// Download Progress
export interface DownloadProgress {
  bytesWritten: number;
  totalBytes: number;
  percentage: number;
}

// OTA Events
export type OTAEventType = 
  | 'update_available'
  | 'update_not_available'
  | 'download_started'
  | 'download_progress'
  | 'download_completed'
  | 'download_failed'
  | 'install_started'
  | 'install_completed'
  | 'install_failed'
  | 'rollback_started'
  | 'rollback_completed'
  | 'rollback_failed';

export interface OTAEvent {
  type: OTAEventType;
  data?: any;
  timestamp: Date;
}

// OTA Manager State
export interface OTAState {
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  isInstalling: boolean;
  updateInfo: UpdateInfo | null;
  error: string | null;
  lastCheckTime: Date | null;
}

// Bundle Information
export interface BundleInfo {
  version: string;
  hash: string;
  size: number;
  path: string;
  downloadedAt: Date;
}

// Installation Result
export interface InstallResult {
  success: boolean;
  error?: string;
  requiresRestart?: boolean;
}

// Rollback Information
export interface RollbackInfo {
  previousVersion: string;
  currentVersion: string;
  reason: string;
}

// Device Information
export interface DeviceInfo {
  deviceId: string;
  platform: Platform;
  appVersion: string;
  bundleVersion: string;
  osVersion: string;
  model: string;
}

export type OTABundleType = 'js-bundle' | 'zip-patch' | 'apk' | 'aab' | 'ipa' | 'web-zip';

export interface PatchFileEntry {
  path: string;
  hash: string;
  size: number;
}

export interface PatchManifest {
  format: 'ota-zip-overlay-patch';
  patchFromVersion: string;
  targetVersion: string;
  bundleType: OTABundleType;
  createdAt: string;
  files: PatchFileEntry[];
  deleteFiles?: string[];
}
