import { Router } from 'express';
import { createMessage, addReaction, remixMessage } from '../controllers/messageController';
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

router.post('/', createMessage);
router.post('/:id/react', addReaction);
router.post('/:id/remix', remixMessage);

export default router;
