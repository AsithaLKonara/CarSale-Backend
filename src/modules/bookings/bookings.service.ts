import { prisma } from '../../lib/prisma';

export interface BookingCreateInput {
  name: string;
  email: string;
  phone?: string;
  preferredDate: Date;
  carInterest?: string;
  notes?: string;
}

export interface BookingUpdateInput {
  status?: string;
  notes?: string;
  assignedToId?: string;
  followUpDate?: Date | string;
}

class BookingsService {
  // 1. Submit VIP Concierge request
  public async createBooking(data: BookingCreateInput) {
    return prisma.booking.create({
      data,
    });
  }

  // 2. Fetch list of requests for dashboards (supporting status filter)
  public async getBookingsList(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return prisma.booking.findMany({
      where,
      orderBy: { preferredDate: 'asc' },
    });
  }

  // 3. Update active status (pending -> confirmed -> completed)
  public async updateBookingStatus(id: string, status: string) {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error(`Booking request with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return prisma.booking.update({
      where: { id },
      data: { status },
    });
  }

  // 4. Update booking details (assignment, follow-up date, notes)
  public async updateBooking(id: string, data: BookingUpdateInput) {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error(`Booking request with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const { followUpDate, ...rest } = data;

    return prisma.booking.update({
      where: { id },
      data: {
        ...rest,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
    });
  }

  // 5. Delete VIP schedule request
  public async deleteBooking(id: string) {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      const error: any = new Error(`Booking request with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    await prisma.booking.delete({ where: { id } });
    return true;
  }
}

export const bookingsService = new BookingsService();
