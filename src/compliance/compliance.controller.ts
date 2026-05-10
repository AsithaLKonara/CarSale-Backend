import { Request, Response, NextFunction } from 'express';
import { GDPRService } from './gdpr.service';

export class ComplianceController {
  /**
   * POST /api/compliance/export
   */
  public exportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ status: 'error', message: 'Target client email parameter required.' });
        return;
      }

      const dump = await GDPRService.exportUserData(email);
      res.status(200).json({ status: 'success', data: dump });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/compliance/forget
   */
  public forgetData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ status: 'error', message: 'Target client email parameter required.' });
        return;
      }

      const result = await GDPRService.eraseUserData(email);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };
}

export const complianceController = new ComplianceController();
export default complianceController;
