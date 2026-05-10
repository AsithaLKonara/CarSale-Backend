import { Router } from 'express';
import { getOverview, getCarsMetrics, getBookingsMetrics, postTrackEvent, getLiveStream } from './analytics.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// 1. Public endpoint to log interaction telemetry (used by landing client)
router.post('/track', postTrackEvent);

// 2. Secured administrative endpoints for analytics dashboards
router.get('/overview', authMiddleware, roleMiddleware([UserRole.admin, UserRole.editor]), getOverview);
router.get('/cars', authMiddleware, roleMiddleware([UserRole.admin, UserRole.editor]), getCarsMetrics);
router.get('/bookings', authMiddleware, roleMiddleware([UserRole.admin, UserRole.editor]), getBookingsMetrics);
router.get('/stream', authMiddleware, getLiveStream);

export default router;
