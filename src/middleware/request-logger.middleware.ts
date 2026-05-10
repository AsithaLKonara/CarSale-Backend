import { Request, Response, NextFunction } from 'express';
import { logger } from '../observability/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const endTimer = logger.startTimer();
  
  res.on('finish', () => {
    endTimer(`HTTP ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};
