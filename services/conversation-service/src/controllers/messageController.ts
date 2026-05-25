import { Response } from 'express';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { AuthRequest } from '../middleware/authMiddleware';

export const createMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { conversationId, content, role, branchId, attachments } = req.body;

    if (!conversationId || !content || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = await Message.create({
      conversationId,
      userId,
      branchId: branchId || conversation.activeBranch,
      content,
      role,
      attachments: attachments || [],
    });

    // Update conversation timestamp
    await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
};

export const addReaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;

    if (!reaction) {
      return res.status(400).json({ error: 'Reaction is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.reactions) {
      message.reactions = [];
    }

    message.reactions.push(reaction);
    await message.save();

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

export const remixMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { style, content } = req.body;

    if (!style || !content) {
      return res.status(400).json({ error: 'Style and content are required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.remixes) {
      message.remixes = [];
    }

    message.remixes.push({
      style,
      content,
      createdAt: new Date(),
    });
    await message.save();

    res.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('Remix message error:', error);
    res.status(500).json({ error: 'Failed to remix message' });
  }
};
