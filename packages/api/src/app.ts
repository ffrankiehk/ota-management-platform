import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import otaRouter from './routes/ota';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/auth';

const app = express();

// Middleware - Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  /^http:\/\/127\.0\.0\.1:\d+$/, // Allow all localhost ports (for browser preview proxy)
];

// Add CORS_ORIGIN from environment if present
if (config.cors.origin) {
  allowedOrigins.push(config.cors.origin);
}

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow bundle downloads
}));
app.use(express.json({ limit: '10mb' }));

// Static files - serve uploaded bundles (public access for OTA downloads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate limiting for API routes
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// OTA client routes (public - no auth required)
app.use('/api/v1/ota', otaRouter);

// Auth routes (public)
app.use('/api/v1/auth', authRouter);

// Admin routes (protected - requires authentication)
app.use('/api/v1/admin', authMiddleware, adminRouter);

export default app;
