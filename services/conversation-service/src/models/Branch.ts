import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  conversationId: mongoose.Types.ObjectId;
  name: string;
  parentBranch: string;
  branchPointMessageId: string;
  createdAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    parentBranch: {
      type: String,
      required: true,
    },
    branchPointMessageId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

BranchSchema.index({ conversationId: 1, name: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
