import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  activeBranch: string;
  moodTheme?: string;
  isShared: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    activeBranch: {
      type: String,
      default: 'main',
    },
    moodTheme: {
      type: String,
      required: false,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, createdAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
