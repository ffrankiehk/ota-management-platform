import { Router } from 'express';
import { checkUpdate } from '../controllers/ota/checkUpdate';
import { getConfig } from '../controllers/ota/getConfig';
import { reportStatus } from '../controllers/ota/reportStatus';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET /api/v1/ota/config
router.get('/config', getConfig);

// GET/POST /api/v1/ota/check-update (support both for backward compatibility)
router.get('/check-update', checkUpdate);
router.post('/check-update', checkUpdate);

// POST /api/v1/ota/report-status
router.post('/report-status', reportStatus);

// GET /api/v1/ota/download/:filename - Download bundle files
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'bundles', filename);
  
  // Security check: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Send file
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    }
  });
});

export default router;
