import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { mediaController } from './media.controller';
import { upload } from './media.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';

const router = Router();

// Protected single asset file upload (Admin & Editor only)
router.post(
  '/upload',
  authMiddleware,
  roleMiddleware([UserRole.admin, UserRole.editor]),
  upload.single('file'),
  mediaController.uploadFile
);

export default router;
