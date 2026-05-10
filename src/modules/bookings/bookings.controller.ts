import { Request, Response, NextFunction } from 'express';
import { bookingsService } from './bookings.service';
import { logAction } from '../audit/audit.service';
import { broadcastToAdmins } from '../../socket';
import { createNotification } from '../notifications/notifications.service';
import { sendBookingReceipt, sendBookingConfirmedAlert } from '../email/email.service';

class BookingsController {
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await bookingsService.createBooking(req.body);
      
      // Register Audit action
      await logAction({
        action: 'booking_create',
        entity: 'Booking',
        entityId: booking.id,
        userId: req.user?.userId,
        metadata: { name: booking.name, email: booking.email, carInterest: booking.carInterest, ip: req.ip },
      });

      // Register persistent Notification
      await createNotification({
        title: 'New VIP Booking Request',
        message: `VIP client ${booking.name} requested a showroom appointment for the ${booking.carInterest || 'selected model'}.`,
        type: 'booking'
      });

      // Dispatch luxury receipt email confirmation asynchronously in background
      sendBookingReceipt({
        name: booking.name,
        email: booking.email,
        carInterest: booking.carInterest || 'Selected Luxury Stable',
        dateTime: booking.preferredDate,
        notes: booking.notes || undefined,
      }).catch(err => console.error('Background mail dispatch failure:', err));

      // Broadcast Socket events to administrative rooms
      broadcastToAdmins('booking:created', booking);

      res.status(201).json({
        status: 'success',
        message: 'VIP Concierge booking request filed successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;
      const bookings = await bookingsService.getBookingsList(status as string);

      res.status(200).json({
        status: 'success',
        data: { bookings },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const booking = await bookingsService.updateBookingStatus(id, status);

      // Register Audit action
      await logAction({
        action: 'booking_status_update',
        entity: 'Booking',
        entityId: id,
        userId: req.user?.userId,
        metadata: { status, ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      // Broadcast Socket events to administrative rooms
      broadcastToAdmins('booking:updated', booking);

      res.status(200).json({
        status: 'success',
        message: 'VIP booking status updated successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await bookingsService.deleteBooking(id);

      // Register Audit action
      await logAction({
        action: 'booking_delete',
        entity: 'Booking',
        entityId: id,
        userId: req.user?.userId,
        metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
      });

      // Broadcast Socket events to administrative rooms
      broadcastToAdmins('booking:deleted', { id });

      res.status(200).json({
        status: 'success',
        message: 'VIP booking request record deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await bookingsService.updateBookingStatus(id, 'confirmed');

      await logAction({
        action: 'booking_approve',
        entity: 'Booking',
        entityId: id,
        userId: req.user?.userId,
        metadata: { ip: req.ip },
      });

      // Dispatch automated VIP confirmation email to user
      sendBookingConfirmedAlert({
        name: booking.name,
        email: booking.email,
        carInterest: booking.carInterest || 'Luxury Showcase Model',
        dateTime: booking.preferredDate,
      }).catch((err) => console.error('Booking confirmation email failure:', err));

      broadcastToAdmins('booking:updated', booking);

      res.status(200).json({
        status: 'success',
        message: 'Booking request confirmed successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  };

  public reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await bookingsService.updateBookingStatus(id, 'rejected');

      await logAction({
        action: 'booking_reject',
        entity: 'Booking',
        entityId: id,
        userId: req.user?.userId,
        metadata: { ip: req.ip },
      });

      broadcastToAdmins('booking:updated', booking);

      res.status(200).json({
        status: 'success',
        message: 'Booking request rejected successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  };

  public followup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { notes, assignedToId, followUpDate } = req.body;

      const booking = await bookingsService.updateBooking(id, {
        notes,
        assignedToId,
        followUpDate,
      });

      await logAction({
        action: 'booking_followup',
        entity: 'Booking',
        entityId: id,
        userId: req.user?.userId,
        metadata: { notes, assignedToId, followUpDate, ip: req.ip },
      });

      broadcastToAdmins('booking:updated', booking);

      res.status(200).json({
        status: 'success',
        message: 'Booking follow-up timeline updated successfully',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const bookingsController = new BookingsController();
