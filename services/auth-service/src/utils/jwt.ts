import jwt from 'jsonwebtoken';

// Read env vars lazily: this module is imported (hoisted) before
// dotenv.config() runs in index.ts, so reading at module load would
// always fall back to the default secret.
const getJwtSecret = () => process.env.JWT_SECRET || 'your-secret-key';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '30d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};
