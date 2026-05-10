import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';
import { validateRequest } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { loginRateLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

// 1. Public Authentication Endpoints
router.post('/login', loginRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// 2. Protected Session Profiler
router.get('/me', authMiddleware, authController.me);

// 3. Admin-only Invite/Register Endpoint
router.post(
  '/register',
  authMiddleware,
  roleMiddleware([UserRole.admin]),
  validateRequest(registerSchema),
  authController.register
);

export default router;
