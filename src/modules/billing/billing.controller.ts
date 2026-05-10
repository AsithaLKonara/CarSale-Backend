import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../observability/logger';

export class BillingController {
  private PLANS = {
    starter: {
      name: 'Starter Dealership Plan',
      price: '$299/mo',
      limits: { maxCars: 10, aiRecommendations: false, analyticsLevel: 'basic' },
    },
    pro: {
      name: 'Pro Showroom Plan',
      price: '$799/mo',
      limits: { maxCars: 50, aiRecommendations: true, analyticsLevel: 'advanced' },
    },
    enterprise: {
      name: 'Enterprise Consolidated SaaS Plan',
      price: '$1,999/mo',
      limits: { maxCars: 9999, aiRecommendations: true, analyticsLevel: 'real-time' },
    },
  };

  /**
   * POST /api/billing/checkout
   * Synthesizes checkouts sessions and forwards mock gateway approvals.
   */
  public createCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { planTier } = req.body;
      const orgId = req.organization?.id;

      if (!planTier || !['starter', 'pro', 'enterprise'].includes(planTier)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid plan selection. Tier must be starter, pro, or enterprise',
        });
        return;
      }

      logger.info(`💳 Launching mock payment checkout gateway flow for organization ID: ${orgId}`, { planTier });

      // Return sandbox transactional redirect targets
      res.status(200).json({
        status: 'success',
        data: {
          checkoutUrl: `https://checkout.stripe.com/pay/mock_session_${Math.random().toString(36).substring(2, 11)}`,
          planName: this.PLANS[planTier as keyof typeof this.PLANS].name,
          price: this.PLANS[planTier as keyof typeof this.PLANS].price,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/billing/subscription
   * Returns current tier specifications and capacity details.
   */
  public getSubscriptionDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgSlug = req.organization?.slug || 'ultradrive-hq';

      // Default all local organizations to the Pro Tier on Sandbox to unleash maximum features!
      const activeTier = orgSlug === 'ultradrive-hq' ? 'enterprise' : 'pro';
      const spec = this.PLANS[activeTier as keyof typeof this.PLANS];

      res.status(200).json({
        status: 'success',
        data: {
          organization: req.organization?.name,
          slug: orgSlug,
          activePlan: spec.name,
          cost: spec.price,
          capabilities: spec.limits,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const billingController = new BillingController();
