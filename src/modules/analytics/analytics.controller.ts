import { Request, Response, NextFunction } from 'express';
import { getOverviewMetrics, getCarVisitorMetrics, getBookingStatusMetrics, trackEvent } from './analytics.service';
import { AnalyticsStreamService } from '../../streams/analytics.stream';

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOverviewMetrics();
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCarsMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCarVisitorMetrics();
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingsMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getBookingStatusMetrics();
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const postTrackEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventType, path, carId, metadata } = req.body;
    await trackEvent({ eventType, path, carId, metadata });
    res.status(200).json({
      status: 'success',
      message: 'Event logged successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getLiveStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.organization?.id;
    const stream = await AnalyticsStreamService.getStreamingKPIs(orgId);
    res.status(200).json({
      status: 'success',
      data: stream,
    });
  } catch (error) {
    next(error);
  }
};
