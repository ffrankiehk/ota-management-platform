import { BaseEntity, Platform, UserRole, ReleaseStatus } from './common';

// Database entity interfaces
export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  apiKey: string;
}

export interface Application extends BaseEntity {
  organizationId: string;
  name: string;
  bundleId: string;
  platform: Platform;
  currentVersion?: string;
  isActive: boolean;
  organization?: Organization;
}

export interface Release extends BaseEntity {
  applicationId: string;
  version: string;
  buildNumber: number;
  bundleUrl: string;
  bundleHash: string;
  bundleSize: number;
  minAppVersion?: string;
  releaseNotes?: string;
  rolloutPercentage: number;
  isMandatory: boolean;
  status: ReleaseStatus;
  releasedAt?: Date;
  createdBy: string;
  application?: Application;
}

export interface Device extends BaseEntity {
  applicationId: string;
  deviceId: string;
  platform: Platform;
  appVersion?: string;
  bundleVersion?: string;
  lastCheckAt?: Date;
  lastUpdateAt?: Date;
  application?: Application;
}

export interface UpdateLog extends BaseEntity {
  deviceId: string;
  releaseId: string;
  action: string;
  status: 'success' | 'failed' | 'in_progress';
  errorMessage?: string;
  device?: Device;
  release?: Release;
}

export interface User extends BaseEntity {
  organizationId: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  organization?: Organization;
}
