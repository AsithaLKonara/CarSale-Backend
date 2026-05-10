import { Request, Response, NextFunction } from 'express';
import { ConciergeAgent } from './concierge.agent';
import { AnalyticsAgent } from './analytics.agent';
import { SalesAgent } from './sales.agent';

export class AgentsController {
  /**
   * GET /api/agents/concierge
   */
  public triggerConcierge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const result = await ConciergeAgent.analyzeScheduling(orgId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/agents/analytics
   */
  public triggerAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const result = await AnalyticsAgent.generateReport(orgId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/agents/sales
   */
  public triggerSales = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const result = await SalesAgent.scoreLeads(orgId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const agentsController = new AgentsController();
export default agentsController;
