import { prisma } from '../utils/prisma.js';
import { clearSettingsCache } from '../utils/settings.js';
import { createPromotionSchema, updatePromotionSchema, createCouponSchema } from '../utils/validation/promotion.schemas.js';

const now = () => new Date();

/**
 * Check if promotion applies: active, within date range, minOrderAmount, restrictPaymentMethods, restrictCustomerType.
 */
function promotionApplies(promo, subtotal, paymentMethod, isGuest) {
  if (!promo.isActive || promo.deletedAt) return false;
  const n = now();
  if (n < promo.startDate || n > promo.endDate) return false;
  if (promo.minOrderAmount != null && Number(promo.minOrderAmount) > subtotal) return false;
  if (promo.restrictPaymentMethods) {
    try {
      const allowed = JSON.parse(promo.restrictPaymentMethods);
      if (Array.isArray(allowed) && !allowed.includes(paymentMethod)) return false;
    } catch (_) {}
  }
  if (promo.restrictCustomerType) {
    const type = promo.restrictCustomerType.toUpperCase();
    if (type === 'GUEST' && !isGuest) return false;
    if (type === 'REGISTERED' && isGuest) return false;
  }
  return true;
}

/**
 * Compute discount amount for a promotion. validatedItems = [{ quantity, unitPrice }], subtotal, totalTickets.
 */
function computeDiscountAmount(promo, subtotal, validatedItems, totalTickets) {
  const value = promo.value != null ? Number(promo.value) : 0;
  const maxDiscount = promo.maxDiscount != null ? Number(promo.maxDiscount) : null;

  let discount = 0;
  switch (promo.type) {
    case 'PERCENTAGE':
      discount = Math.round((subtotal * value) / 100);
      if (maxDiscount != null) discount = Math.min(discount, maxDiscount);
      break;
    case 'FIXED_AMOUNT':
      discount = Math.min(value, subtotal);
      break;
    case 'BUY_ONE_GET_ONE': {
      if (totalTickets < 2) break;
      const freeCount = Math.floor(totalTickets / 2);
      const minPrice = Math.min(...validatedItems.map((i) => i.unitPrice));
      discount = Math.round(freeCount * minPrice);
      break;
    }
    case 'COUPON':
    case 'AUTO':
    case 'FLASH':
      discount = Math.round((subtotal * value) / 100);
      if (maxDiscount != null) discount = Math.min(discount, maxDiscount);
      break;
    default:
      discount = Math.round((subtotal * value) / 100);
      if (maxDiscount != null) discount = Math.min(discount, maxDiscount);
  }

  return Math.min(Math.max(0, discount), subtotal);
}

/**
 * Resolve promotion from coupon code. Returns { promotion, coupon } or null. Validates dates, active, minOrder, restrictions, maxUses.
 */
export async function resolveCoupon(code, subtotal, paymentMethod, isGuest) {
  if (!code || typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findFirst({
    where: { code: normalized, deletedAt: null },
    include: { promotion: true },
  });
  if (!coupon || !coupon.promotion || coupon.promotion.deletedAt) return null;
  if (coupon.promotion.type !== 'COUPON') return null;
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return null;
  if (!promotionApplies(coupon.promotion, subtotal, paymentMethod, isGuest)) return null;
  return { promotion: coupon.promotion, coupon };
}

/**
 * Find best auto-applicable promotion (AUTO or FLASH). One per order.
 */
export async function findAutoPromotion(subtotal, paymentMethod, isGuest) {
  const n = now();
  const list = await prisma.promotion.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      type: { in: ['AUTO', 'FLASH'] },
      startDate: { lte: n },
      endDate: { gte: n },
    },
    orderBy: { endDate: 'asc' },
  });
  let best = null;
  let bestDiscount = 0;
  for (const promo of list) {
    if (!promotionApplies(promo, subtotal, paymentMethod, isGuest)) continue;
    const discount = computeDiscountAmount(promo, subtotal, [], 0);
    if (discount > bestDiscount) {
      bestDiscount = discount;
      best = promo;
    }
  }
  return best;
}

/**
 * Apply single promotion to checkout. Either from couponCode or auto.
 * Returns { promotionId, discountAmount, couponId? } or { promotionId: null, discountAmount: 0 }.
 */
export async function applyPromotion({
  couponCode,
  subtotal,
  validatedItems,
  totalTickets,
  paymentMethod,
  isGuest,
}) {
  let promotion = null;
  let coupon = null;

  if (couponCode) {
    const resolved = await resolveCoupon(couponCode, subtotal, paymentMethod, isGuest);
    if (resolved) {
      promotion = resolved.promotion;
      coupon = resolved.coupon;
    }
  }
  if (!promotion) {
    promotion = await findAutoPromotion(subtotal, paymentMethod, isGuest);
  }

  if (!promotion) return { promotionId: null, discountAmount: 0, couponId: null };

  const discountAmount = computeDiscountAmount(
    promotion,
    subtotal,
    validatedItems,
    totalTickets
  );
  return {
    promotionId: promotion.id,
    discountAmount,
    couponId: coupon?.id ?? null,
  };
}

/**
 * Increment coupon usedCount when booking is confirmed.
 */
export async function incrementCouponUse(couponId) {
  if (!couponId) return;
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });
}

// --- Admin CRUD (used by admin routes) ---

export async function listPromotions(query = {}) {
  const where = { deletedAt: null };
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  return prisma.promotion.findMany({
    where,
    include: { _count: { select: { coupons: true, bookings: true } } },
    orderBy: { startDate: 'desc' },
  });
}

export async function createPromotion(data) {
  const promotion = await prisma.promotion.create({
    data: {
      name: data.name.trim(),
      type: data.type,
      value: data.value ?? null,
      minOrderAmount: data.minOrderAmount ?? null,
      maxDiscount: data.maxDiscount ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isFlash: data.isFlash ?? false,
      restrictPaymentMethods: data.restrictPaymentMethods?.trim() || null,
      restrictCustomerType: data.restrictCustomerType || null,
      isActive: data.isActive ?? true,
    },
  });
  clearSettingsCache();
  return promotion;
}

export async function updatePromotion(id, data) {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.type !== undefined) updateData.type = data.type;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.isFlash !== undefined) updateData.isFlash = data.isFlash;
  if (data.restrictPaymentMethods !== undefined) updateData.restrictPaymentMethods = data.restrictPaymentMethods?.trim() || null;
  if (data.restrictCustomerType !== undefined) updateData.restrictCustomerType = data.restrictCustomerType;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  const updated = await prisma.promotion.update({ where: { id }, data: updateData });
  clearSettingsCache();
  return updated;
}

export async function deletePromotion(id) {
  const result = await prisma.promotion.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  clearSettingsCache();
  return result;
}

export async function listCoupons(query = {}) {
  const where = { deletedAt: null };
  if (query.promotionId) where.promotionId = query.promotionId;
  return prisma.coupon.findMany({
    where,
    include: { promotion: { select: { id: true, name: true, type: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCoupon(data) {
  const existing = await prisma.coupon.findFirst({ where: { code: data.code, deletedAt: null } });
  if (existing) return { error: 'Coupon code already exists' };
  const promotion = await prisma.promotion.findFirst({ where: { id: data.promotionId, deletedAt: null } });
  if (!promotion) return { error: 'Promotion not found' };
  if (promotion.type !== 'COUPON') return { error: 'Promotion must be type COUPON to attach coupons' };
  const coupon = await prisma.coupon.create({
    data: {
      code: data.code,
      promotionId: data.promotionId,
      maxUses: data.maxUses ?? null,
    },
    include: { promotion: { select: { id: true, name: true } } },
  });
  return coupon;
}

export async function deleteCoupon(id) {
  const result = await prisma.coupon.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  clearSettingsCache();
  return result;
}

export async function listPromotionsHandler(req, res, next) {
  try {
    const promotions = await listPromotions(req.query);
    res.json({ success: true, promotions });
  } catch (e) {
    next(e);
  }
}

export async function createPromotionHandler(req, res, next) {
  try {
    const body = createPromotionSchema.parse(req.body);
    const promotion = await createPromotion(body);
    res.status(201).json({ success: true, promotion });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: e.errors });
    }
    next(e);
  }
}

export async function updatePromotionHandler(req, res, next) {
  try {
    const { id } = req.params;
    const body = updatePromotionSchema.parse(req.body);
    const promotion = await updatePromotion(id, body);
    res.json({ success: true, promotion });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: e.errors });
    }
    next(e);
  }
}

export async function deletePromotionHandler(req, res, next) {
  try {
    const { id } = req.params;
    await deletePromotion(id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

export async function listCouponsHandler(req, res, next) {
  try {
    const coupons = await listCoupons(req.query);
    res.json({ success: true, coupons });
  } catch (e) {
    next(e);
  }
}

export async function createCouponHandler(req, res, next) {
  try {
    const body = createCouponSchema.parse(req.body);
    const result = await createCoupon(body);
    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.status(201).json({ success: true, coupon: result });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: e.errors });
    }
    next(e);
  }
}

export async function deleteCouponHandler(req, res, next) {
  try {
    const { id } = req.params;
    await deleteCoupon(id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
