import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        const error: any = new Error('Access denied. User session is unauthenticated');
        error.statusCode = 401;
        error.name = 'UnauthorizedError';
        throw error;
      }

      const hasRole = allowedRoles.includes(req.user.role);
      if (!hasRole) {
        const error: any = new Error('Access denied. Your role does not possess the required permissions');
        error.statusCode = 403;
        error.name = 'ForbiddenError';
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
