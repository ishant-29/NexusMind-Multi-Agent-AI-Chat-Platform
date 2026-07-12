import { Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { File } from '../models/File';
import { AuthRequest } from '../middleware/authMiddleware';
import { extractTextFromPDF, getPDFMetadata } from '../processors/pdfProcessor';
import { extractTextFromDOCX } from '../processors/docxProcessor';
import { getImageMetadata } from '../processors/imageProcessor';

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let textContent = '';
    let metadata: any = {};

    // Process based on file type
    if (file.mimetype === 'application/pdf') {
      textContent = await extractTextFromPDF(file.path);
      metadata = await getPDFMetadata(file.path);
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword'
    ) {
      textContent = await extractTextFromDOCX(file.path);
    } else if (file.mimetype.startsWith('image/')) {
      const imgMetadata = await getImageMetadata(file.path);
      if (imgMetadata) {
        metadata = { width: imgMetadata.width, height: imgMetadata.height };
      }
    } else if (file.mimetype === 'text/plain') {
      textContent = await fs.readFile(file.path, 'utf-8');
    }

    // Save file record to database
    const fileRecord = await File.create({
      userId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/api/files/${file.filename}`,
      textContent,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: {
        id: fileRecord._id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        url: fileRecord.url,
        textContent: textContent ? textContent.substring(0, 500) : undefined,
        metadata,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

export const getFile = async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.userId;

    const fileRecord = await File.findOne({ filename, userId });
    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      data: fileRecord,
    });
  } catch (error: any) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
};

export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.userId;

    const fileRecord = await File.findOne({ filename, userId });
    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(fileRecord.path, fileRecord.originalName);
  } catch (error: any) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const userId = req.user?.userId;

    const fileRecord = await File.findOne({ filename, userId });
    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from disk; a missing physical file must not leave an
    // undeletable orphan record behind
    try {
      await fs.unlink(fileRecord.path);
    } catch (unlinkErr: any) {
      console.error('File unlink failed (continuing with DB delete):', unlinkErr.message);
    }

    // Delete record from database
    await File.deleteOne({ _id: fileRecord._id });

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
};

export const listFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    const files = await File.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-textContent -path');

    const total = await File.countDocuments({ userId });

    res.json({
      success: true,
      data: files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: Number(page) * Number(limit) < total,
      },
    });
  } catch (error: any) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
};
