import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'fr' | 'de';
  defaultModel: 'gemini' | 'deepseek' | 'llama' | 'general';
  webSearchEnabled: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  soundEnabled: boolean;
  saveHistory: boolean;
  analytics: boolean;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de'],
      default: 'en',
    },
    defaultModel: {
      type: String,
      enum: ['gemini', 'deepseek', 'llama', 'general'],
      default: 'general',
    },
    webSearchEnabled: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    browserNotifications: {
      type: Boolean,
      default: false,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    saveHistory: {
      type: Boolean,
      default: true,
    },
    analytics: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  }
);

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
