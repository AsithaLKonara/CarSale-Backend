import { Router } from 'express';
import { billingController } from './billing.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// 1. Subscription & Payment Gateway Routes (Requires Authenticated Dealer context)
router.get('/subscription', authMiddleware, billingController.getSubscriptionDetails);
router.post('/checkout', authMiddleware, billingController.createCheckoutSession);

export default router;
