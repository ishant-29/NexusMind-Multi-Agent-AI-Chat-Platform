import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  branchId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  reactions?: string[];
  remixes?: Array<{
    style: string;
    content: string;
    createdAt: Date;
  }>;
  importance?: number;
  isScheduled?: boolean;
  scheduledFor?: Date;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    textContent?: string;
  }>;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    branchId: {
      type: String,
      default: 'main',
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reactions: [{
      type: String,
    }],
    remixes: [{
      style: String,
      content: String,
      createdAt: { type: Date, default: Date.now },
    }],
    importance: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledFor: {
      type: Date,
      required: false,
    },
    attachments: [{
      id: String,
      name: String,
      type: String,
      size: Number,
      url: String,
      textContent: String,
    }],
  },
  {
    timestamps: false,
  }
);

MessageSchema.index({ conversationId: 1, timestamp: 1 });
MessageSchema.index({ conversationId: 1, branchId: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
