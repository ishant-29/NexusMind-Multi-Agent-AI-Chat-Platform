import { Router } from 'express';
import { register, login, verify, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/verify', authenticate, verify);
router.get('/me', authenticate, getMe);

export default router;
