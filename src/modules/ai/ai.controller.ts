import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from './recommendation.service';

export class AIController {
  /**
   * GET /api/ai/recommendations/:carId
   * Exposes structural similarity matching to show alternative supercar recommendations.
   */
  public getRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { carId } = req.params;
      const limit = Number(req.query.limit) || 3;

      const results = await RecommendationService.getSimilarCars(carId, limit);

      res.status(200).json({
        status: 'success',
        data: { recommendations: results },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/ai/search
   * Runs mathematical semantic searches on natural-text keywords query.
   */
  public semanticSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query } = req.body;
      const limit = Number(req.query.limit) || 5;
      const orgId = req.organization?.id;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Malformed input. Query string is required inside body parameters',
        });
        return;
      }

      const results = await RecommendationService.semanticSearch(query, orgId, limit);

      res.status(200).json({
        status: 'success',
        data: { results },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/ai/metrics
   * Yields engagement score matrices for fleet cars.
   */
  public getInterestMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const results = await RecommendationService.getInterestMetrics(orgId);

      res.status(200).json({
        status: 'success',
        data: { metrics: results },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AIController();
