import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Must be a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
    role: z.nativeEnum(UserRole).optional().default(UserRole.viewer),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Must be a valid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});
