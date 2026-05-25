// Shared TypeScript types for all microservices

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: 'email' | 'google' | 'github';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthToken {
  token: string;
  expiresIn: number;
  user: User;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  activeBranch: string;
  moodTheme?: string;
  isShared: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  branchId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  reactions?: string[];
  remixes?: MessageRemix[];
  importance?: number;
  isScheduled?: boolean;
  scheduledFor?: Date;
  attachments?: FileAttachment[];
}

export interface MessageRemix {
  style: string;
  content: string;
  createdAt: Date;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  textContent?: string;
}

export interface Branch {
  id: string;
  conversationId: string;
  name: string;
  parentBranch: string;
  branchPointMessageId: string;
  createdAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  hasTools: boolean;
  icon?: string;
}

export interface AgentRunRequest {
  agentName: string;
  message: string;
  sessionId?: string;
  userId?: string;
  stream?: boolean;
}

export interface AgentRunResponse {
  runId: string;
  agentName: string;
  sessionId: string;
  messages: Message[];
  toolsUsed?: string[];
  reasoningSteps?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ServiceHealthCheck {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: Date;
  uptime: number;
  version?: string;
}
