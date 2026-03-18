import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '3000'),
  host: process.env.API_HOST || '0.0.0.0',
  
  // Database configuration
  database: {
    // Use SQLite by default for local development. This stores data in a local file
    // at ./database/ota_dev.sqlite relative to the API package root.
    url: process.env.DATABASE_URL || 'sqlite://./database/ota_dev.sqlite',
  },
  
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // File storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'minio',
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost:9000',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      bucket: process.env.MINIO_BUCKET || 'ota-bundles',
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET || 'ota-bundles',
    },
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // File upload
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '.bundle,.js,.json').split(','),
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
