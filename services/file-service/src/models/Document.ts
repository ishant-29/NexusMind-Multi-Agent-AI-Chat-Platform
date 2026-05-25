import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocumentChunk extends MongoDocument {
  documentId: string;
  userId: string;
  filename: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: {
    pageNumber?: number;
    totalPages?: number;
    chunkSize: number;
    overlap: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument extends MongoDocument {
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  status: 'processing' | 'completed' | 'failed';
  totalChunks: number;
  metadata: {
    totalPages?: number;
    wordCount?: number;
    language?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>({
  documentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: true },
  metadata: {
    pageNumber: Number,
    totalPages: Number,
    chunkSize: Number,
    overlap: Number,
  },
}, {
  timestamps: true,
});

// Create vector search index for MongoDB Atlas
DocumentChunkSchema.index({ embedding: '2dsphere' });
DocumentChunkSchema.index({ userId: 1, documentId: 1 });

const DocumentSchema = new Schema<IDocument>({
  userId: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  filePath: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true,
  },
  totalChunks: { type: Number, default: 0 },
  metadata: {
    totalPages: Number,
    wordCount: Number,
    language: String,
  },
}, {
  timestamps: true,
});

DocumentSchema.index({ userId: 1, status: 1 });
DocumentSchema.index({ createdAt: -1 });

export const DocumentChunk = mongoose.model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
export const Document = mongoose.model<IDocument>('Document', DocumentSchema);
