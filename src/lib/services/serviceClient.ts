/**
 * Service Client for Microservices
 * Centralized API calls to all backend services
 */

// NEXT_PUBLIC_ variants are inlined into the client bundle; the plain ones
// only exist server-side. Both are checked so this module works in either.
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || process.env.AUTH_SERVICE_URL || 'http://localhost:4000';
const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || process.env.USER_SERVICE_URL || 'http://localhost:4001';
const CONVERSATION_SERVICE_URL = process.env.NEXT_PUBLIC_CONVERSATION_SERVICE_URL || process.env.CONVERSATION_SERVICE_URL || 'http://localhost:4002';
const FILE_SERVICE_URL = process.env.NEXT_PUBLIC_FILE_SERVICE_URL || process.env.FILE_SERVICE_URL || 'http://localhost:4003';
const AGENT_SERVICE_URL = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL || process.env.AGENT_SERVICE_URL || 'http://localhost:7777';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  token?: string;
  retries?: number;
  timeout?: number;
}

class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public serviceName?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

async function fetchService(url: string, options: RequestOptions = {}) {
  const {
    method = 'GET',
    headers: customHeaders = {},
    body,
    token,
    retries = 2,
    timeout = 30000,
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Extract service name from URL for better error messages
  const serviceName = url.includes('4000') ? 'Auth Service'
    : url.includes('4001') ? 'User Service'
    : url.includes('4002') ? 'Conversation Service'
    : url.includes('4003') ? 'File Service'
    : url.includes('7777') ? 'Agent Service'
    : 'Service';

  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `${serviceName} returned ${response.status}` 
        }));
        
        throw new ServiceError(
          errorData.error || errorData.message || `Request failed with status ${response.status}`,
          response.status,
          serviceName
        );
      }

      return response.json();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (error instanceof ServiceError && error.statusCode) {
        if (error.statusCode >= 400 && error.statusCode < 500 && 
            error.statusCode !== 408 && error.statusCode !== 429) {
          throw error;
        }
      }

      // Don't retry on abort (user cancelled)
      if (error.name === 'AbortError') {
        throw new ServiceError(
          `${serviceName} request timed out`,
          408,
          serviceName
        );
      }

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        if (error instanceof ServiceError) {
          throw error;
        }
        
        // Network error or other issues
        throw new ServiceError(
          `${serviceName} is unavailable. Please check if the service is running.`,
          0,
          serviceName
        );
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError || new ServiceError(`${serviceName} request failed`, 0, serviceName);
}

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  register: async (email: string, password: string, name: string) => {
    return fetchService(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      body: { email, password, name },
    });
  },

  login: async (email: string, password: string) => {
    return fetchService(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      body: { email, password },
    });
  },

  verify: async (token: string) => {
    return fetchService(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      token,
    });
  },

  getMe: async (token: string) => {
    return fetchService(`${AUTH_SERVICE_URL}/api/auth/me`, {
      token,
    });
  },
};

// ============================================
// USER SERVICE
// ============================================

export const userService = {
  getProfile: async (token: string) => {
    return fetchService(`${USER_SERVICE_URL}/api/users/profile`, {
      token,
    });
  },

  getSettings: async (token: string) => {
    return fetchService(`${USER_SERVICE_URL}/api/users/settings`, {
      token,
    });
  },

  updateSettings: async (token: string, settings: any) => {
    return fetchService(`${USER_SERVICE_URL}/api/users/settings`, {
      method: 'PATCH',
      token,
      body: settings,
    });
  },

  deleteAccount: async (token: string) => {
    return fetchService(`${USER_SERVICE_URL}/api/users/account`, {
      method: 'DELETE',
      token,
    });
  },

  clearHistory: async (token: string) => {
    return fetchService(`${USER_SERVICE_URL}/api/users/history`, {
      method: 'DELETE',
      token,
    });
  },
};

// ============================================
// CONVERSATION SERVICE
// ============================================

export const conversationService = {
  list: async (token: string, page = 1, limit = 20) => {
    return fetchService(
      `${CONVERSATION_SERVICE_URL}/api/conversations?page=${page}&limit=${limit}`,
      { token }
    );
  },

  get: async (token: string, id: string) => {
    return fetchService(`${CONVERSATION_SERVICE_URL}/api/conversations/${id}`, {
      token,
    });
  },

  create: async (token: string, title: string) => {
    return fetchService(`${CONVERSATION_SERVICE_URL}/api/conversations`, {
      method: 'POST',
      token,
      body: { title },
    });
  },

  delete: async (token: string, id: string) => {
    return fetchService(`${CONVERSATION_SERVICE_URL}/api/conversations/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  createBranch: async (token: string, id: string, targetMessageId: string) => {
    return fetchService(`${CONVERSATION_SERVICE_URL}/api/conversations/${id}/branch`, {
      method: 'POST',
      token,
      body: { targetMessageId },
    });
  },

  createMessage: async (
    token: string,
    conversationId: string,
    content: string,
    role: 'user' | 'assistant',
    attachments?: any[]
  ) => {
    return fetchService(`${CONVERSATION_SERVICE_URL}/api/messages`, {
      method: 'POST',
      token,
      body: { conversationId, content, role, attachments },
    });
  },

  addReaction: async (token: string, messageId: string, reaction: string) => {
    return fetchService(`${CONVERSATION_SERVICE_URL}/api/messages/${messageId}/react`, {
      method: 'POST',
      token,
      body: { reaction },
    });
  },

  remixMessage: async (token: string, messageId: string, style: string, content: string) => {
    return fetchService(`${CONVERSATION_SERVICE_URL}/api/messages/${messageId}/remix`, {
      method: 'POST',
      token,
      body: { style, content },
    });
  },
};

// ============================================
// FILE SERVICE
// ============================================

export const fileService = {
  upload: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${FILE_SERVICE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  list: async (token: string, page = 1, limit = 20) => {
    return fetchService(
      `${FILE_SERVICE_URL}/api/files?page=${page}&limit=${limit}`,
      { token }
    );
  },

  get: async (token: string, filename: string) => {
    return fetchService(`${FILE_SERVICE_URL}/api/files/${filename}`, {
      token,
    });
  },

  delete: async (token: string, filename: string) => {
    return fetchService(`${FILE_SERVICE_URL}/api/files/${filename}`, {
      method: 'DELETE',
      token,
    });
  },

  getDownloadUrl: (filename: string) => {
    return `${FILE_SERVICE_URL}/api/files/${filename}/download`;
  },
};

// ============================================
// AGENT SERVICE
// ============================================

export const agentService = {
  listAgents: async () => {
    return fetchService(`${AGENT_SERVICE_URL}/api/agents/list`);
  },

  getAgent: async (agentId: string) => {
    return fetchService(`${AGENT_SERVICE_URL}/api/agents/${agentId}`);
  },

  runAgent: async (
    agentName: string,
    message: string,
    sessionId?: string,
    userId?: string
  ) => {
    return fetchService(`${AGENT_SERVICE_URL}/v1/runs`, {
      method: 'POST',
      body: {
        agent_name: agentName,
        message,
        session_id: sessionId,
        user_id: userId,
        stream: false,
      },
    });
  },

  streamAgent: (
    agentName: string,
    message: string,
    sessionId?: string,
    userId?: string
  ) => {
    return fetch(`${AGENT_SERVICE_URL}/v1/runs/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_name: agentName,
        message,
        session_id: sessionId,
        user_id: userId,
        stream: true,
      }),
    });
  },

  getSession: async (sessionId: string) => {
    return fetchService(`${AGENT_SERVICE_URL}/v1/sessions/${sessionId}`);
  },

  trackUsage: async (agentId: string) => {
    return fetchService(`${AGENT_SERVICE_URL}/api/agents/${agentId}/track`, {
      method: 'POST',
    });
  },

  getStats: async () => {
    return fetchService(`${AGENT_SERVICE_URL}/api/agents/stats`);
  },
};

// Export service URLs for direct access if needed
export const SERVICE_URLS = {
  AUTH: AUTH_SERVICE_URL,
  USER: USER_SERVICE_URL,
  CONVERSATION: CONVERSATION_SERVICE_URL,
  FILE: FILE_SERVICE_URL,
  AGENT: AGENT_SERVICE_URL,
};
