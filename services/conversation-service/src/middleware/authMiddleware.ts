import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Read lazily: this module is imported before dotenv.config() runs in index.ts
const getAuthServiceUrl = () => process.env.AUTH_SERVICE_URL || 'http://localhost:4000';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token with auth service
    const response = await axios.post(
      `${getAuthServiceUrl()}/api/auth/verify`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success && response.data.user) {
      req.user = {
        userId: response.data.user.id,
        email: response.data.user.email,
      };
      next();
    } else {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
