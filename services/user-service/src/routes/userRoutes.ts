import { Router } from 'express';
import {
  getProfile,
  getSettings,
  updateSettings,
  deleteAccount,
  clearHistory,
} from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', getProfile);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.delete('/account', deleteAccount);
router.delete('/history', clearHistory);

export default router;
