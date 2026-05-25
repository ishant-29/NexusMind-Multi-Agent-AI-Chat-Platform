import { Document, DocumentChunk } from '../models/Document';
import { ChunkingService } from './chunkingService';
import { EmbeddingService } from './embeddingService';
import fs from 'fs/promises';
import path from 'path';

/**
 * Document Processor Service
 * Handles document processing, chunking, and vectorization
 */

export class DocumentProcessor {
  /**
   * Process a document: extract text, chunk, and vectorize
   */
  static async processDocument(
    documentId: string,
    userId: string,
    filePath: string,
    filename: string,
    fileType: string
  ): Promise<void> {
    try {
      console.log(`📄 Processing document: ${filename}`);

      // Update document status
      await Document.findByIdAndUpdate(documentId, { status: 'processing' });

      // Extract text from file
      const text = await this.extractText(filePath, fileType);

      if (!text || text.trim().length === 0) {
        throw new Error('No text content extracted from document');
      }

      console.log(`📝 Extracted ${text.length} characters`);

      // Chunk the text
      const chunkSize = ChunkingService.getOptimalChunkSize(text.length);
      const chunks = ChunkingService.chunkText(text, {
        chunkSize,
        overlap: 200,
        preserveParagraphs: true,
      });

      console.log(`✂️  Created ${chunks.length} chunks`);

      // Process chunks in batches to avoid rate limits
      const BATCH_SIZE = 10;
      let processedChunks = 0;

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map(chunk => chunk.content);

        // Generate embeddings for batch
        const embeddings = await EmbeddingService.generateEmbeddings(texts);

        // Save chunks with embeddings
        const chunkDocuments = batch.map((chunk, idx) => ({
          documentId,
          userId,
          filename,
          chunkIndex: chunk.index,
          content: chunk.content,
          embedding: embeddings[idx],
          metadata: {
            chunkSize: chunk.metadata.chunkSize,
            overlap: chunk.metadata.overlap,
          },
        }));

        await DocumentChunk.insertMany(chunkDocuments);
        processedChunks += batch.length;

        console.log(`💾 Saved ${processedChunks}/${chunks.length} chunks`);
      }

      // Update document with completion status
      await Document.findByIdAndUpdate(documentId, {
        status: 'completed',
        totalChunks: chunks.length,
        metadata: {
          wordCount: text.split(/\s+/).length,
          language: 'en', // Could add language detection
        },
      });

      console.log(`✅ Document processing complete: ${filename}`);
    } catch (error: any) {
      console.error(`❌ Error processing document ${filename}:`, error);

      // Update document status to failed
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Extract text from different file types
   */
  private static async extractText(
    filePath: string,
    fileType: string
  ): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.txt':
        return await this.extractFromTxt(filePath);
      case '.pdf':
        return await this.extractFromPdf(filePath);
      case '.doc':
      case '.docx':
        return await this.extractFromDocx(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Extract text from TXT file
   */
  private static async extractFromTxt(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * Extract text from PDF file
   */
  private static async extractFromPdf(filePath: string): Promise<string> {
    // Use pdf-parse library
    const pdfParse = require('pdf-parse');
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Extract text from DOCX file
   */
  private static async extractFromDocx(filePath: string): Promise<string> {
    // Use mammoth library
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Search for relevant chunks using vector similarity
   */
  static async searchDocuments(
    userId: string,
    query: string,
    options: {
      limit?: number;
      documentIds?: string[];
      minScore?: number;
    } = {}
  ): Promise<Array<{
    content: string;
    filename: string;
    documentId: string;
    score: number;
    chunkIndex: number;
  }>> {
    const { limit = 5, documentIds, minScore = 0.7 } = options;

    // Generate embedding for query
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    // Build query filter
    const filter: any = { userId };
    if (documentIds && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    // Get all chunks for user (or filtered documents)
    const chunks = await DocumentChunk.find(filter).lean();

    // Calculate similarity scores
    const results = chunks.map(chunk => ({
      content: chunk.content,
      filename: chunk.filename,
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      score: EmbeddingService.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Filter by minimum score and sort by score
    return results
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Delete document and all its chunks
   */
  static async deleteDocument(documentId: string, userId: string): Promise<void> {
    // Delete all chunks
    await DocumentChunk.deleteMany({ documentId, userId });

    // Delete document
    const doc = await Document.findOneAndDelete({ _id: documentId, userId });

    if (doc && doc.filePath) {
      // Delete physical file
      try {
        await fs.unlink(doc.filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  }
}
