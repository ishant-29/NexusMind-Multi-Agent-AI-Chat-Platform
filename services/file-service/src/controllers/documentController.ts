import { Request, Response } from 'express';
import { Document, DocumentChunk } from '../models/Document';
import { DocumentProcessor } from '../services/documentProcessor';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

export const uploadMiddleware = upload.single('document');

/**
 * Upload and process a document
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create document record
    const document = await Document.create({
      userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      status: 'processing',
    });

    // Process document asynchronously
    DocumentProcessor.processDocument(
      document._id.toString(),
      userId,
      req.file.path,
      req.file.filename,
      req.file.mimetype
    ).catch(error => {
      console.error('Background processing error:', error);
    });

    res.json({
      success: true,
      data: {
        id: document._id,
        filename: document.originalName,
        status: document.status,
        message: 'Document uploaded and processing started',
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
};

/**
 * Get all documents for a user
 */
export const getUserDocuments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const documents = await Document.find({ userId })
      .sort({ createdAt: -1 })
      .select('-filePath')
      .lean();

    res.json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch documents' });
  }
};

/**
 * Get a specific document
 */
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const document = await Document.findOne({ _id: id, userId })
      .select('-filePath')
      .lean();

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch document' });
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await DocumentProcessor.deleteDocument(id, userId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete document' });
  }
};

/**
 * Search documents using RAG
 */
export const searchDocuments = async (req: Request, res: Response) => {
  try {
    const { query, documentIds, limit = 5, minScore = 0.3 } = req.body;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await DocumentProcessor.searchDocuments(userId, query, {
      limit: parseInt(limit),
      documentIds,
      minScore: parseFloat(minScore),
    });

    res.json({
      success: true,
      data: {
        query,
        results,
        count: results.length,
      },
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
};

/**
 * Get document chunks (for debugging/inspection)
 */
export const getDocumentChunks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const chunks = await DocumentChunk.find({ documentId: id, userId })
      .select('-embedding') // Don't send embeddings to client
      .sort({ chunkIndex: 1 })
      .lean();

    res.json({
      success: true,
      data: chunks,
    });
  } catch (error: any) {
    console.error('Get chunks error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chunks' });
  }
};
