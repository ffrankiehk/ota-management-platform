import { Router } from 'express';
import { login, getMe } from '../controllers/auth/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', login);

// GET /api/v1/auth/me (protected)
router.get('/me', authMiddleware, getMe);

export default router;
