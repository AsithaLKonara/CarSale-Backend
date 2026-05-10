import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Exception Intercepted:', err);

  let statusCode = err.statusCode || 500;
  let errorName = err.name || 'InternalServerError';
  let message = err.message || 'Something went wrong on the server';
  let details: any = null;

  // 1. Zod Validation Formatting
  if (err instanceof ZodError) {
    statusCode = 400;
    errorName = 'ValidationError';
    message = 'The requested parameters failed validation';
    details = err.errors.map((e) => ({
      field: e.path.join('.'),
      issue: e.message,
    }));
  }

  // 2. Prisma Database Exception Formatting
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    errorName = 'DatabaseError';
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409;
        message = 'A record with that unique field already exists';
        details = { target: err.meta?.target };
        break;
      case 'P2025': // Record to update/delete not found
        statusCode = 404;
        message = 'The requested record could not be found';
        break;
      default:
        statusCode = 400;
        message = `Prisma Database operation failed: [${err.code}]`;
        break;
    }
  }

  // 3. JsonWebToken Exception Formatting
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorName = 'UnauthorizedError';
    message = 'The provided access token is invalid or corrupt';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorName = 'TokenExpiredError';
    message = 'The provided access token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || errorName,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
