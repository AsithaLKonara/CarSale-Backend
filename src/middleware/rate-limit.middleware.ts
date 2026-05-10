import rateLimit from 'express-rate-limit';
import { logAction } from '../modules/audit/audit.service';
import { Request, Response } from 'express';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit to 5 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    await logAction({
      action: 'login_throttled',
      entity: 'AdminUser',
      metadata: { ip: req.ip, userAgent: req.headers['user-agent'], email: req.body?.email },
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
    });
  },
});

export const leadsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit to 5 lead creations per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many lead submissions from this IP. Please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
    });
  },
});

export const bookingsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit to 5 bookings per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many booking inquiries from this IP. Please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
    });
  },
});

