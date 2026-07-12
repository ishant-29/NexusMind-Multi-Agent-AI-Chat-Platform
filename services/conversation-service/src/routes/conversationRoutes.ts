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

// Reject malformed ObjectIds up front so they 404 instead of a CastError 500
router.param('id', (req, res, next, id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

router.get('/', getConversations);
router.get('/:id', getConversation);
router.post('/', createConversation);
router.delete('/:id', deleteConversation);
router.post('/:id/branch', createBranch);

export default router;
