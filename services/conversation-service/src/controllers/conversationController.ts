import { Response } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Branch } from '../models/Branch';
import { AuthRequest } from '../middleware/authMiddleware';

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Conversation.countDocuments({ userId });

    res.json({
      success: true,
      data: conversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: Number(page) * Number(limit) < total,
      },
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversationId: id,
      branchId: conversation.activeBranch,
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const conversation = await Conversation.create({
      userId,
      title: title.slice(0, 200),
      activeBranch: 'main',
    });

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Delete all messages
    await Message.deleteMany({ conversationId: id });

    // Delete all branches
    await Branch.deleteMany({ conversationId: id });

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { targetMessageId, branchName } = req.body;

    const conversation = await Conversation.findOne({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages up to target message
    const messages = await Message.find({
      conversationId: id,
      branchId: conversation.activeBranch,
    }).sort({ timestamp: 1 });

    const targetIndex = messages.findIndex(
      (msg) => msg._id.toString() === targetMessageId
    );

    if (targetIndex === -1) {
      return res.status(404).json({ error: 'Target message not found' });
    }

    // Create new conversation for branch
    const newConversation = await Conversation.create({
      userId,
      title: `${conversation.title} (Branch)`,
      activeBranch: branchName || 'branch-' + Date.now(),
    });

    // Copy messages up to target
    const messagesToCopy = messages.slice(0, targetIndex + 1);
    for (const msg of messagesToCopy) {
      await Message.create({
        conversationId: newConversation._id,
        userId: msg.userId,
        branchId: newConversation.activeBranch,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
        attachments: msg.attachments,
      });
    }

    // Create branch record
    await Branch.create({
      conversationId: newConversation._id,
      name: newConversation.activeBranch,
      parentBranch: conversation.activeBranch,
      branchPointMessageId: targetMessageId,
    });

    res.status(201).json({
      success: true,
      data: {
        conversationId: newConversation._id,
        branchName: newConversation.activeBranch,
      },
    });
  } catch (error: any) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
};
