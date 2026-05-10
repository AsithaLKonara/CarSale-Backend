import { Router } from 'express';
import { agentsController } from './agents.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/permission.middleware';

const router = Router();

// Secure AI Operations pathing (requires agents:trigger permission or Admin status)
router.get(
  '/concierge',
  authMiddleware,
  hasPermission('agents:trigger'),
  agentsController.triggerConcierge
);

router.get(
  '/analytics',
  authMiddleware,
  hasPermission('agents:trigger'),
  agentsController.triggerAnalytics
);

router.get(
  '/sales',
  authMiddleware,
  hasPermission('agents:trigger'),
  agentsController.triggerSales
);

export default router;
