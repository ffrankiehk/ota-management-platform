import { ApiResponse, PaginationParams, PaginatedResponse, Platform } from './common';
import { Application, Release, Device, User, Organization } from './database';

// API Request/Response types

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
  expiresIn: string;
}

// OTA Client API
export interface CheckUpdateRequest {
  bundleId: string;
  platform: Platform;
  currentVersion: string;
  bundleVersion: string;
  deviceId: string;
  accountId?: string;
}

export interface CheckUpdateResult {
  action: 'none' | 'update' | 'rollback';
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;

  // Present when action=update/rollback
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

  // Backward compatibility (legacy clients)
  hasUpdate?: boolean;
  release?: {
    id: string;
    version: string;
    bundleUrl: string;
    bundleHash: string;
    bundleSize: number;
    isMandatory: boolean;
    releaseNotes: string;
  };
}

// OTA Config API
export interface OTAConfigResult {
  bundleVersion: string;
  nativeVersion: string;
  checkIntervalSeconds: number;
}

export interface DownloadStatsRequest {
  releaseId: string;
  deviceId: string;
  action: 'download_start' | 'download_complete' | 'install_success' | 'install_failed';
  errorMessage?: string;
}

// Admin API
export interface CreateApplicationRequest {
  name: string;
  bundleId: string;
  platform: Platform;
}

export interface UpdateApplicationRequest {
  name?: string;
  isActive?: boolean;
}

export interface CreateReleaseRequest {
  version: string;
  buildNumber: number;
  minAppVersion?: string;
  releaseNotes?: string;
  isMandatory?: boolean;
}

export interface UpdateReleaseRequest {
  releaseNotes?: string;
  rolloutPercentage?: number;
  isMandatory?: boolean;
  status?: 'active' | 'paused' | 'archived';
}

export interface RolloutRequest {
  percentage: number;
}

// Response types
export type CheckUpdateResponse = ApiResponse<CheckUpdateResult>;
export type OTAConfigResponse = ApiResponse<OTAConfigResult>;
export type ApplicationsResponse = ApiResponse<PaginatedResponse<Application>>;
export type ReleasesResponse = ApiResponse<PaginatedResponse<Release>>;
export type DevicesResponse = ApiResponse<PaginatedResponse<Device>>;
export type UsersResponse = ApiResponse<PaginatedResponse<User>>;

// Analytics
export interface AnalyticsOverview {
  totalApplications: number;
  totalReleases: number;
  totalDevices: number;
  activeUpdates: number;
  updateSuccessRate: number;
}

export interface ApplicationAnalytics {
  applicationId: string;
  deviceCount: number;
  versionDistribution: Record<string, number>;
  platformDistribution: Record<Platform, number>;
  updateStats: {
    successful: number;
    failed: number;
    pending: number;
  };
}

export interface ReleaseAnalytics {
  releaseId: string;
  downloadCount: number;
  installCount: number;
  successRate: number;
  rolloutProgress: number;
  deviceBreakdown: {
    total: number;
    updated: number;
    failed: number;
    pending: number;
  };
}
