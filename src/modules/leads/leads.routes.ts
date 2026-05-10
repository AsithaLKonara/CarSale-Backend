import { Router } from 'express';
import { leadsController } from './leads.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/permission.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { leadsRateLimiter } from '../../middleware/rate-limit.middleware';
import { createLeadSchema, updateLeadSchema } from './leads.validation';

const router = Router();

// Public route to submit interest (from landing page / inquiry modals)
router.post('/submit', leadsRateLimiter, validateRequest(createLeadSchema), leadsController.create);

// Protected routes for CRM operations
router.get('/', authMiddleware, hasPermission('bookings:view'), leadsController.list);
router.post('/', authMiddleware, hasPermission('bookings:view'), validateRequest(createLeadSchema), leadsController.create);
router.put('/:id', authMiddleware, hasPermission('bookings:view'), validateRequest(updateLeadSchema), leadsController.update);
router.delete('/:id', authMiddleware, hasPermission('bookings:view'), leadsController.delete);

export default router;
