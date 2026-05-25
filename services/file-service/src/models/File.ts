import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  textContent?: string;
  metadata?: {
    width?: number;
    height?: number;
    pages?: number;
  };
  createdAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    textContent: {
      type: String,
      required: false,
    },
    metadata: {
      width: Number,
      height: Number,
      pages: Number,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

FileSchema.index({ userId: 1, createdAt: -1 });

export const File = mongoose.model<IFile>('File', FileSchema);
