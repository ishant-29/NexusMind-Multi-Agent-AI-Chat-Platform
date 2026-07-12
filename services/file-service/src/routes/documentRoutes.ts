import { Router } from 'express';
import {
  uploadDocument,
  getUserDocuments,
  getDocument,
  deleteDocument,
  searchDocuments,
  getDocumentChunks,
  uploadMiddleware,
} from '../controllers/documentController';
import { authenticateUserOrService } from '../middleware/serviceAuth';

const router = Router();

// All document routes require an identity: either an end-user Bearer token
// or an internal service key + x-user-id (Next.js gateway / agent service)
router.use(authenticateUserOrService);

// Reject malformed ObjectIds up front so they 404 instead of a CastError 500
router.param('id', (req, res, next, id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

// Upload document
router.post('/upload', uploadMiddleware, uploadDocument);

// Get all user documents
router.get('/', getUserDocuments);

// Search documents (RAG) — before /:id so "search" is never parsed as an id
router.post('/search', searchDocuments);

// Get specific document
router.get('/:id', getDocument);

// Delete document
router.delete('/:id', deleteDocument);

// Get document chunks (for debugging)
router.get('/:id/chunks', getDocumentChunks);

export default router;
