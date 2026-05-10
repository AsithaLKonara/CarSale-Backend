import { z } from 'zod';

// Nested Asset Schemas
const imageSchema = z.object({
  url: z.string().url({ message: 'Asset url must be a valid link' }),
  type: z.string().min(1, { message: 'Asset image type is required (e.g. hero, gallery)' }),
});

const specSchema = z.object({
  label: z.string().min(1, { message: 'Spec label is required' }),
  value: z.string().min(1, { message: 'Spec value is required' }),
});

// Primary Create/Update validation
export const createCarSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'Vehicle name is required' }),
    slug: z.string().min(1, { message: 'Vehicle slug is required' }),
    brand: z.string().min(1, { message: 'Brand name is required' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
    horsepower: z.number().int().positive({ message: 'Horsepower must be a positive integer' }),
    torque: z.number().int().positive({ message: 'Torque must be a positive integer' }),
    topSpeed: z.number().int().positive({ message: 'Top speed must be a positive integer' }),
    zeroTo100: z.number().positive({ message: '0-100 speed must be a positive decimal' }),
    price: z.string().optional(),
    category: z.string().min(1, { message: 'Category is required (e.g. hypercar, track, luxury)' }),
    isFeatured: z.boolean().optional().default(false),
    images: z.array(imageSchema).optional().default([]),
    specs: z.array(specSchema).optional().default([]),
  }),
});

export const updateCarSchema = z.object({
  body: createCarSchema.shape.body.partial(),
});

// List query validation
export const carQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
    search: z.string().optional(),
    category: z.string().optional(),
    isFeatured: z.string().optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  }),
});
