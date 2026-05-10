import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { bookingsController } from './bookings.controller';
import { createBookingSchema, updateBookingStatusSchema } from './bookings.validation';
import { validateRequest } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

const router = Router();

// 1. Public Concierge Registration (anyone can book a private viewing slot)
router.post('/', validateRequest(createBookingSchema), bookingsController.create);

// 2. Protected Booking Dashboards (All authenticated admins, editors, or viewers can see schedules)
router.get(
  '/',
  authMiddleware,
  roleMiddleware([UserRole.admin, UserRole.editor, UserRole.viewer]),
  bookingsController.list
);

// 3. Protected Status Transition Updates (Admins & Editors only)
router.patch(
  '/:id',
  authMiddleware,
  roleMiddleware([UserRole.admin, UserRole.editor]),
  validateRequest(updateBookingStatusSchema),
  bookingsController.updateStatus
);

// 4. Protected Booking Deletion (Admins only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware([UserRole.admin]),
  bookingsController.delete
);

// 5. Advanced CRM scheduling updates
router.patch(
  '/:id/approve',
  authMiddleware,
  roleMiddleware([UserRole.admin, UserRole.editor]),
  bookingsController.approve
);

router.patch(
  '/:id/reject',
  authMiddleware,
  roleMiddleware([UserRole.admin, UserRole.editor]),
  bookingsController.reject
);

router.patch(
  '/:id/followup',
  authMiddleware,
  roleMiddleware([UserRole.admin, UserRole.editor]),
  bookingsController.followup
);

export default router;
