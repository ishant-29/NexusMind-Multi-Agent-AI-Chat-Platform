import { Router } from 'express';
import { createMessage, addReaction, remixMessage } from '../controllers/messageController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createMessage);
router.post('/:id/react', addReaction);
router.post('/:id/remix', remixMessage);

export default router;
