import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
  };
}

// Read lazily: this module is imported before dotenv.config() runs in index.ts
const getAuthServiceUrl = () => process.env.AUTH_SERVICE_URL || 'http://localhost:4000';
const getServiceApiKey = () => process.env.SERVICE_API_KEY || 'dev-service-key';

/**
 * Authenticates a request either as:
 *  1. An internal service-to-service call: `x-service-key` header matching
 *     SERVICE_API_KEY plus an `x-user-id` header identifying the acting user
 *     (used by the Next.js gateway and the agent service RAG tool), or
 *  2. An end-user call with a Bearer token verified against the auth service.
 */
export const authenticateUserOrService = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const serviceKey = req.headers['x-service-key'];

    if (typeof serviceKey === 'string' && serviceKey.length > 0) {
      if (serviceKey !== getServiceApiKey()) {
        return res.status(401).json({ error: 'Invalid service key' });
      }

      const userId = req.headers['x-user-id'];
      if (typeof userId !== 'string' || userId.length === 0) {
        return res.status(400).json({ error: 'x-user-id header is required for service calls' });
      }

      req.user = { userId };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const response = await axios.post(
      `${getAuthServiceUrl()}/api/auth/verify`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success && response.data.user) {
      req.user = {
        userId: response.data.user.id,
        email: response.data.user.email,
      };
      return next();
    }

    return res.status(401).json({ error: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
