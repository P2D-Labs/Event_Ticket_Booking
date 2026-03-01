import { z } from 'zod';

export const checkoutSchema = z.object({
  eventId: z.string().cuid(),
  items: z.array(z.object({
    ticketTypeId: z.string().cuid(),
    quantity: z.number().int().min(1),
  })).min(1),
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(1).max(255).optional(),
  guestPhone: z.string().min(1).max(30).optional(),
  couponCode: z.string().max(50).optional(),
  paymentMethod: z.enum(['STRIPE', 'KOKO', 'MINTPAY', 'ON_ENTRY']).optional(),
});
