import { Router } from 'express';
import { carsController } from './cars.controller';
import { carQuerySchema, createCarSchema, updateCarSchema } from './cars.validation';
import { validateRequest } from '../../middleware/validation.middleware';
import { authMiddleware } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/permission.middleware';

const router = Router();

// 1. Public Showroom Endpoints
router.get('/', validateRequest(carQuerySchema), carsController.list);
router.get('/:slug', carsController.getBySlug);

// 2. Protected Spec-Editing Endpoints (Requires cars:create / cars:edit permissions)
router.post(
  '/',
  authMiddleware,
  hasPermission('cars:create'),
  validateRequest(createCarSchema),
  carsController.create
);

router.put(
  '/:id',
  authMiddleware,
  hasPermission('cars:edit'),
  validateRequest(updateCarSchema),
  carsController.update
);

// 3. Protected Deletion Endpoints (Requires cars:delete permissions)
router.delete(
  '/:id',
  authMiddleware,
  hasPermission('cars:delete'),
  carsController.delete
);

// 4. Advanced Real Dealership Commands
router.patch(
  '/:id/status',
  authMiddleware,
  hasPermission('cars:edit'),
  carsController.updateStatus
);

router.post(
  '/:id/duplicate',
  authMiddleware,
  hasPermission('cars:create'),
  carsController.duplicate
);

router.post(
  '/bulk-delete',
  authMiddleware,
  hasPermission('cars:delete'),
  carsController.bulkDelete
);

router.post(
  '/bulk-publish',
  authMiddleware,
  hasPermission('cars:edit'),
  carsController.bulkPublish
);

export default router;
