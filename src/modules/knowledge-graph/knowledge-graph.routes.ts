import { Router } from 'express';
import { knowledgeGraphController } from './knowledge-graph.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/permission.middleware';

const router = Router();

// Retrieve full interactive knowledge graph node networks (requires relationship:view or Admin)
router.get(
  '/',
  authMiddleware,
  hasPermission('relationships:view'),
  knowledgeGraphController.getGraph
);

export default router;
