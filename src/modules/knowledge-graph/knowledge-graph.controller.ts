import { Request, Response, NextFunction } from 'express';
import { KnowledgeGraphService } from './knowledge-graph.service';

export class KnowledgeGraphController {
  /**
   * GET /api/knowledge-graph
   */
  public getGraph = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const graph = await KnowledgeGraphService.buildTenantGraph(orgId);

      res.status(200).json({
        status: 'success',
        data: graph,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const knowledgeGraphController = new KnowledgeGraphController();
export default knowledgeGraphController;
