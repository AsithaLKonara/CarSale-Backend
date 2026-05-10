import { Router } from 'express';
import { list, read, readAll } from './notifications.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Secured endpoints for retrieving, clicking, and dismissing alerts
router.get('/', authMiddleware, roleMiddleware([UserRole.admin, UserRole.editor, UserRole.viewer]), list);
router.put('/:id/read', authMiddleware, roleMiddleware([UserRole.admin, UserRole.editor, UserRole.viewer]), read);
router.post('/read-all', authMiddleware, roleMiddleware([UserRole.admin, UserRole.editor, UserRole.viewer]), readAll);

export default router;
