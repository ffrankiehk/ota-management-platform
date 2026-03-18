import { Router } from 'express';
import { checkUpdate } from '../controllers/ota/checkUpdate';
import { getConfig } from '../controllers/ota/getConfig';
import { reportStatus } from '../controllers/ota/reportStatus';

const router = Router();

// GET /api/v1/ota/config
router.get('/config', getConfig);

// GET/POST /api/v1/ota/check-update (support both for backward compatibility)
router.get('/check-update', checkUpdate);
router.post('/check-update', checkUpdate);

// POST /api/v1/ota/report-status
router.post('/report-status', reportStatus);

export default router;
