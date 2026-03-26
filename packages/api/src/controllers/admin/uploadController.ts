import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'bundles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const safeName = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${safeName}-${timestamp}${ext}`);
  },
});

// File filter - allow all platform bundle extensions
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = [
    // React Native
    '.bundle', '.js', '.jsbundle', '.hbc',
    // Android
    '.apk', '.aab', '.zip',
    // iOS
    '.ipa',
    // Flutter
    '.apk', '.ipa', '.aab',
    // Web
    '.tar.gz', '.tgz', '.zip',
    // General archives
    '.gz', '.tar'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`));
  }
};

// Multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

// Calculate SHA256 hash of a file
const calculateFileHash = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

// POST /api/v1/admin/upload
export const uploadBundle = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        timestamp: new Date().toISOString(),
      });
    }

    const file = req.file;
    const filePath = file.path;

    // Calculate hash
    const hash = await calculateFileHash(filePath);

    // Get file stats
    const stats = fs.statSync(filePath);

    // Generate URL using API download endpoint (works through Apache reverse proxy)
    const baseUrl = process.env.PUBLIC_URL || process.env.API_BASE_URL || 'https://ota.2maru.com';
    const bundleUrl = `${baseUrl}/api/v1/ota/download/${file.filename}`;

    return res.json({
      success: true,
      data: {
        filename: file.filename,
        originalName: file.originalname,
        size: stats.size,
        hash,
        url: bundleUrl,
        mimeType: file.mimetype,
      },
      message: 'File uploaded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in uploadBundle:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
};
