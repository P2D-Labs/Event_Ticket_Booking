import { z } from 'zod';

const promotionTypeEnum = ['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_ONE_GET_ONE', 'COUPON', 'AUTO', 'FLASH'];

export const createPromotionSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(promotionTypeEnum),
  value: z.number().min(0).optional().nullable(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  isFlash: z.boolean().optional(),
  restrictPaymentMethods: z.string().optional().nullable(),
  restrictCustomerType: z.enum(['GUEST', 'REGISTERED', 'ALL']).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((s) => s.trim().toUpperCase()),
  promotionId: z.string().cuid(),
  maxUses: z.number().int().min(1).optional().nullable(),
});
