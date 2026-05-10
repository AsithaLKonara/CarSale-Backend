import { Request, Response, NextFunction } from 'express';

export const requestTimeout = (timeoutMs: number = 10000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Request timeout exceeded. The server took too long to respond.',
          code: 'REQUEST_TIMEOUT',
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};
