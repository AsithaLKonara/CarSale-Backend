import { Router } from 'express';
import { complianceController } from './compliance.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { hasPermission } from '../middleware/permission.middleware';

const router = Router();

// Secure compliance workflows (requires compliance:write or Admin check)
router.post(
  '/export',
  authMiddleware,
  hasPermission('compliance:write'),
  complianceController.exportData
);

router.post(
  '/forget',
  authMiddleware,
  hasPermission('compliance:write'),
  complianceController.forgetData
);

export default router;
