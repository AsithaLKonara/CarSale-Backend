import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Retrieve corporate audit records, restricted only to administrators
router.get('/', authMiddleware, roleMiddleware([UserRole.admin]), getAuditLogs);

export default router;
