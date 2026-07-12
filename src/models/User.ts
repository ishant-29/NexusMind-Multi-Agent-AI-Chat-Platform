import mongoose, { Schema, Document } from "mongoose";

export interface IUserSettings {
  theme?: "light" | "dark" | "system";
  language?: "en" | "es" | "fr" | "de";
  defaultModel?: "gemini" | "deepseek" | "llama";
  webSearchEnabled?: boolean;
  emailNotifications?: boolean;
  browserNotifications?: boolean;
  soundEnabled?: boolean;
  saveHistory?: boolean;
  analytics?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  provider: "email" | "google" | "github";
  image?: string;
  settings?: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    provider: { 
      type: String, 
      enum: ["email", "google", "github"], 
      default: "email" 
    },
    image: { type: String },
    settings: {
      type: {
        theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
        language: { type: String, enum: ["en", "es", "fr", "de"], default: "en" },
        defaultModel: { type: String, enum: ["gemini", "deepseek", "llama"], default: "gemini" },
        webSearchEnabled: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        browserNotifications: { type: Boolean, default: false },
        soundEnabled: { type: Boolean, default: true },
        saveHistory: { type: Boolean, default: true },
        analytics: { type: Boolean, default: true },
      },
      default: {},
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
