import { Router } from 'express';
import { aiController } from './ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/permission.middleware';

const router = Router();

// 1. Public Semantic & Vector-Like Recommendation Endpoints
router.get('/recommendations/:carId', aiController.getRecommendations);
router.post('/search', aiController.semanticSearch);

// 2. Protected Engagement Analytics Metrics
router.get(
  '/metrics',
  authMiddleware,
  hasPermission('analytics:view'),
  aiController.getInterestMetrics
);

export default router;
