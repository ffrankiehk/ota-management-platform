import { Router } from 'express';
import {
  listApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  createRelease,
  updateRelease,
  deleteRelease,
} from '../controllers/admin/applicationsController';
import { getOverview } from '../controllers/admin/overviewController';
import { upload, uploadBundle } from '../controllers/admin/uploadController';
import { listDevices, getDeviceById, deleteDevice } from '../controllers/admin/devicesController';
import { listUpdateLogs, getUpdateStats } from '../controllers/admin/updateLogsController';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/admin/usersController';
import {
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  regenerateApiKey,
} from '../controllers/admin/organizationsController';
import * as rollbackController from '../controllers/admin/rollbackController';
import * as webhookController from '../controllers/admin/webhookController';

const router = Router();

// GET /api/v1/admin/overview
router.get('/overview', getOverview);

// GET /api/v1/admin/applications
router.get('/applications', listApplications);

// POST /api/v1/admin/applications
router.post('/applications', createApplication);

// GET /api/v1/admin/applications/:id
router.get('/applications/:id', getApplicationById);

// PUT /api/v1/admin/applications/:id
router.put('/applications/:id', updateApplication);

// DELETE /api/v1/admin/applications/:id
router.delete('/applications/:id', deleteApplication);

// POST /api/v1/admin/applications/:id/releases
router.post('/applications/:id/releases', createRelease);

// PUT /api/v1/admin/releases/:releaseId
router.put('/releases/:releaseId', updateRelease);

// DELETE /api/v1/admin/releases/:releaseId
router.delete('/releases/:releaseId', deleteRelease);

// POST /api/v1/admin/upload - Upload bundle file
router.post('/upload', upload.single('file'), uploadBundle);

// GET /api/v1/admin/devices
router.get('/devices', listDevices);

// GET /api/v1/admin/devices/:id
router.get('/devices/:id', getDeviceById);

// DELETE /api/v1/admin/devices/:id
router.delete('/devices/:id', deleteDevice);

// GET /api/v1/admin/update-logs
router.get('/update-logs', listUpdateLogs);
router.get('/update-logs/stats', getUpdateStats);

// Rollback routes
router.get('/releases/:releaseId/health', rollbackController.monitorReleaseHealth);
router.post('/releases/:releaseId/rollback', rollbackController.rollbackRelease);
router.get('/applications/:applicationId/rollback-history', rollbackController.getRollbackHistory);

// Webhook routes
router.post('/webhooks/test', webhookController.testWebhook);

// Users routes
router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Organizations routes
router.get('/organizations', listOrganizations);
router.post('/organizations', createOrganization);
router.put('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);
router.post('/organizations/:id/regenerate-api-key', regenerateApiKey);

export default router;
