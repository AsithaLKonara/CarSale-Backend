import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Gatekeeper middleware validating if the authenticated administrator holds the required capabilities.
 * Supports universal super-admin wildcard permissions ('*') and standard static role fallbacks.
 */
export const hasPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userPayload = req.user;
      if (!userPayload) {
        const error: any = new Error('Access denied. Authentication context is missing');
        error.statusCode = 401;
        error.name = 'UnauthorizedError';
        throw error;
      }

      // Fetch active user with custom dynamic DB roles
      const user = await prisma.adminUser.findUnique({
        where: { id: userPayload.userId },
        include: { customRole: true },
      });

      if (!user) {
        const error: any = new Error('Access denied. Active account not found in system records');
        error.statusCode = 401;
        error.name = 'UnauthorizedError';
        throw error;
      }

      let capabilities: string[] = [];

      // 1. Check database-backed dynamic custom role
      if (user.customRole) {
        capabilities = user.customRole.permissions as string[];
      } else {
        // 2. Fallback: Map static userRole enum values to default permissions
        if (user.role === 'admin') {
          capabilities = ['*'];
        } else if (user.role === 'editor') {
          capabilities = [
            'cars:view',
            'cars:create',
            'cars:edit',
            'bookings:view',
            'bookings:edit',
            'notifications:view',
          ];
        } else {
          capabilities = ['cars:view', 'bookings:view'];
        }
      }

      // 3. Dynamic evaluations
      const hasWildcard = capabilities.includes('*');
      const hasDirectPermission = capabilities.includes(requiredPermission);

      if (!hasWildcard && !hasDirectPermission) {
        const error: any = new Error(
          `Access forbidden. Required capability '${requiredPermission}' is missing for this account.`
        );
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
