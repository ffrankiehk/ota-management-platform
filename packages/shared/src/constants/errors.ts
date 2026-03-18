// Error codes and messages
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Application errors
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  APP_ALREADY_EXISTS: 'APP_ALREADY_EXISTS',
  
  // Release errors
  RELEASE_NOT_FOUND: 'RELEASE_NOT_FOUND',
  INVALID_VERSION: 'INVALID_VERSION',
  BUNDLE_UPLOAD_FAILED: 'BUNDLE_UPLOAD_FAILED',
  
  // Update errors
  NO_UPDATE_AVAILABLE: 'NO_UPDATE_AVAILABLE',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  HASH_VERIFICATION_FAILED: 'HASH_VERIFICATION_FAILED',
  INSTALL_FAILED: 'INSTALL_FAILED',
  
  // General errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ERROR_CODES.UNAUTHORIZED]: 'Access denied',
  [ERROR_CODES.APP_NOT_FOUND]: 'Application not found',
  [ERROR_CODES.APP_ALREADY_EXISTS]: 'Application with this bundle ID already exists',
  [ERROR_CODES.RELEASE_NOT_FOUND]: 'Release not found',
  [ERROR_CODES.INVALID_VERSION]: 'Invalid version format',
  [ERROR_CODES.BUNDLE_UPLOAD_FAILED]: 'Failed to upload bundle file',
  [ERROR_CODES.NO_UPDATE_AVAILABLE]: 'No update available',
  [ERROR_CODES.DOWNLOAD_FAILED]: 'Failed to download update',
  [ERROR_CODES.HASH_VERIFICATION_FAILED]: 'Bundle integrity verification failed',
  [ERROR_CODES.INSTALL_FAILED]: 'Failed to install update',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded'
} as const;
