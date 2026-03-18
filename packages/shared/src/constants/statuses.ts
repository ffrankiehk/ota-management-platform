// Status constants
export const RELEASE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ARCHIVED: 'archived'
} as const;

export const UPDATE_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  IN_PROGRESS: 'in_progress'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer'
} as const;
