// Common utility types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type Platform = 'ios' | 'android' | 'both';

export type UserRole = 'admin' | 'developer' | 'viewer';

export type ReleaseStatus = 'draft' | 'active' | 'paused' | 'archived';

export type UpdateAction = 'check' | 'download_start' | 'download_complete' | 'install_success' | 'install_failed' | 'rollback';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
