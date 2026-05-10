import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Lead name is required' }),
    email: z.string().email({ message: 'A valid email address is required' }),
    phone: z.string().optional(),
    message: z.string().optional(),
    source: z.string().optional(),
    status: z.enum(['new', 'contacted', 'test_drive', 'negotiation', 'won', 'lost', 'interested', 'closed'], {
      message: 'Status must be a valid lead stage'
    }).optional(),
    priority: z.enum(['low', 'medium', 'high', 'hot', 'warm', 'cold'], {
      message: 'Priority must be high, medium, low, hot, warm, or cold'
    }).optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email({ message: 'A valid email address is required' }).optional(),
    phone: z.string().optional(),
    message: z.string().optional(),
    source: z.string().optional(),
    status: z.enum(['new', 'contacted', 'test_drive', 'negotiation', 'won', 'lost', 'interested', 'closed'], {
      message: 'Status must be a valid lead stage'
    }).optional(),
    priority: z.enum(['low', 'medium', 'high', 'hot', 'warm', 'cold'], {
      message: 'Priority must be high, medium, low, hot, warm, or cold'
    }).optional(),
    followUpDate: z.string().transform((str) => new Date(str)).optional().nullable(),
  }),
});
