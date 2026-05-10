import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from '../modules/auth/auth.types';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: any = new Error('Access denied. Authentication token is missing');
      error.statusCode = 401;
      error.name = 'UnauthorizedError';
      throw error;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_default_access_secret';

    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    // Attach validated payload back to standard Express context
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};
