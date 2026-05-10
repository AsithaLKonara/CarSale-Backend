import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  roleId?: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  roleId?: string | null;
  createdAt: Date;
}

// Extend global Express namespace to attach user to Request objects
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
export interface AuthRequest extends Request {
  user?: TokenPayload;
}
