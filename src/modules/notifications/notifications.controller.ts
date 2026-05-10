import { Request, Response, NextFunction } from 'express';
import { getNotificationsList, markNotificationRead, markAllNotificationsRead } from './notifications.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = Number(req.query.limit) || 50;
    const skip = Number(req.query.skip) || 0;
    const orgId = req.organization?.id;
    
    const notifications = await getNotificationsList(unreadOnly, limit, skip, orgId);

    res.status(200).json({
      status: 'success',
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

export const read = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await markNotificationRead(id);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read successfully',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const readAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organization?.id;
    await markAllNotificationsRead(orgId);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read successfully',
    });
  } catch (error) {
    next(error);
  }
};
