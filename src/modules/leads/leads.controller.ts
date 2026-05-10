import { Request, Response, NextFunction } from 'express';
import { leadsService } from './leads.service';
import { logAction } from '../audit/audit.service';
import { clearCache } from '../../lib/redis';
import { broadcastToAdmins } from '../../socket';
import { sendNewLeadAlert } from '../email/email.service';

export class LeadsController {
  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const leads = await leadsService.getLeadsList(req.query, orgId);

      res.status(200).json({
        status: 'success',
        data: { leads },
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organization?.id;
      const lead = await leadsService.createLead(req.body, orgId);

      // Register Audit
      await logAction({
        action: 'lead_create',
        entity: 'Lead',
        entityId: lead.id,
        userId: req.user?.userId,
        metadata: { name: lead.name, source: lead.source, ip: req.ip },
      });

      // Dispatch real CRM notification alert in background
      sendNewLeadAlert({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || undefined,
        message: lead.message || undefined,
        source: lead.source || undefined,
      }).catch((err) => console.error('Lead mail alert trigger failure:', err));

      broadcastToAdmins('lead:created', lead);

      res.status(201).json({
        status: 'success',
        message: 'Lead inquiry registered successfully',
        data: { lead },
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const orgId = req.organization?.id;
      const lead = await leadsService.updateLead(id, req.body, orgId);

      await logAction({
        action: 'lead_update',
        entity: 'Lead',
        entityId: lead.id,
        userId: req.user?.userId,
        metadata: { status: lead.status, ip: req.ip },
      });

      broadcastToAdmins('lead:updated', lead);

      res.status(200).json({
        status: 'success',
        message: 'Lead profile updated successfully',
        data: { lead },
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const orgId = req.organization?.id;
      await leadsService.deleteLead(id, orgId);

      await logAction({
        action: 'lead_delete',
        entity: 'Lead',
        entityId: id,
        userId: req.user?.userId,
        metadata: { ip: req.ip },
      });

      broadcastToAdmins('lead:deleted', { id });

      res.status(200).json({
        status: 'success',
        message: 'Lead profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const leadsController = new LeadsController();
export default leadsController;
