import { Request, Response, NextFunction } from 'express';
import { fetchAuditLogs } from './audit.service';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const skip = Number(req.query.skip) || 0;
    const logs = await fetchAuditLogs(limit, skip);

    res.status(200).json({
      status: 'success',
      data: { logs },
    });
  } catch (error) {
    next(error);
  }
};
