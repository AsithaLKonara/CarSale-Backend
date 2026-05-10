import { Router } from 'express';
import { getSearchResults } from './search.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Secured endpoint for executing deep lookup queries
router.get('/', authMiddleware, roleMiddleware([UserRole.admin, UserRole.editor, UserRole.viewer]), getSearchResults);

export default router;
