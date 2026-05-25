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

const router = Router();

// Upload document
router.post('/upload', uploadMiddleware, uploadDocument);

// Get all user documents
router.get('/', getUserDocuments);

// Get specific document
router.get('/:id', getDocument);

// Delete document
router.delete('/:id', deleteDocument);

// Search documents (RAG)
router.post('/search', searchDocuments);

// Get document chunks (for debugging)
router.get('/:id/chunks', getDocumentChunks);

export default router;
