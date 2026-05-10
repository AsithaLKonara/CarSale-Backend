import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import compression from 'compression';

// Import Modular Routers
import authRoutes from './modules/auth/auth.routes';
import carRoutes from './modules/cars/cars.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import mediaRoutes from './modules/media/media.routes';
import auditRoutes from './modules/audit/audit.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import searchRoutes from './modules/search/search.routes';
import complianceRoutes from './compliance/compliance.routes';
import leadsRoutes from './modules/leads/leads.routes';

// Import Error Handler Middleware
import { errorHandler } from './middleware/error.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { requestTimeout } from './middleware/timeout.middleware';

dotenv.config();

const app = express();

// Apply Gzip payload compression
app.use(compression());

// Apply global request tracking and timeout protection
app.use(requestLogger);
app.use(requestTimeout(10000)); // 10 seconds request timeout limit

// 1. Core Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allows frontend to render uploaded static assets
}));

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true, // Crucial for HTTP-Only cookie sharing
  })
);

app.use(express.json());
app.use(cookieParser());

// 2. Serve uploaded assets statically
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

// 3. Optional Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests filed from this IP address, please try again later.',
    code: 'TOO_MANY_REQUESTS'
  }
});
app.use('/api', limiter);
app.use('/api', tenantMiddleware);

// 4. Base Health Check Route
app.use('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 5. Mount Modular API Routers
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/leads', leadsRoutes);

// 6. 404 Route Intercept
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `The endpoint ${req.originalUrl} does not exist on this server`,
    code: 'NOT_FOUND'
  });
});

// 7. Mount Centralized Exception Handler
app.use(errorHandler);

export default app;
