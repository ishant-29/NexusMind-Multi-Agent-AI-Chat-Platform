import { Router } from 'express';
import {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  createBranch,
} from '../controllers/conversationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getConversations);
router.get('/:id', getConversation);
router.post('/', createConversation);
router.delete('/:id', deleteConversation);
router.post('/:id/branch', createBranch);

export default router;
