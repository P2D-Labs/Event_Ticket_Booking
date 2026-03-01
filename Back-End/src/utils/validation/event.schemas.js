import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().min(1),
  location: z.string().min(1).max(500).trim(),
  venue: z.string().max(255).trim().optional(),
  eventDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}/)]),
  eventTime: z.string().max(20).trim().optional(),
  coverImage: z.string().url().or(z.string().min(1)),
  seatingImage: z.string().url().or(z.string().min(1)).optional(),
  categoryId: z.string().cuid().optional().nullable(),
  organizerId: z.string().cuid().optional(),
  ticketTypes: z.array(
    z.object({
      name: z.string().min(1).max(100),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  bookingOpensAt: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}/)]).optional().nullable(),
  paymentMethods: z.array(z.enum(['STRIPE', 'KOKO', 'MINTPAY', 'ON_ENTRY'])).optional(),
});

export const updateEventSchema = createEventSchema.partial();
