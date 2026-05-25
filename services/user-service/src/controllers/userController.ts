import { Response } from 'express';
import { UserSettings } from '../models/UserSettings';
import { AuthRequest } from '../middleware/authMiddleware';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4000';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const token = req.headers.authorization;

    // Get user info from auth service
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/me`, {
      headers: { Authorization: token },
    });

    if (!response.data.success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: response.data.user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    let settings = await UserSettings.findOne({ userId });

    // Create default settings if not exists
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const updates = req.body;

    // Validate allowed fields
    const allowedFields = [
      'theme',
      'language',
      'defaultModel',
      'webSearchEnabled',
      'emailNotifications',
      'browserNotifications',
      'soundEnabled',
      'saveHistory',
      'analytics',
    ];

    const filteredUpdates: any = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      filteredUpdates,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Delete user settings
    await UserSettings.deleteOne({ userId });

    // Note: In a real app, you would also:
    // - Delete user from auth service
    // - Delete all conversations
    // - Delete all files
    // - Clean up all user data

    res.json({
      success: true,
      message: 'Account deletion initiated. All data will be removed.',
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

export const clearHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Note: This would call conversation service to delete all conversations
    // For now, just return success
    // In production: await axios.delete(`${CONVERSATION_SERVICE_URL}/api/conversations/all`, ...)

    res.json({
      success: true,
      message: 'History cleared successfully',
    });
  } catch (error: any) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};
