import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Your name is required' }),
    email: z.string().email({ message: 'A valid email address is required' }),
    phone: z.string().optional(),
    preferredDate: z.string().transform((str) => new Date(str)),
    carInterest: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'completed'], {
      message: 'Status must be pending, confirmed, or completed',
    }),
  }),
});
