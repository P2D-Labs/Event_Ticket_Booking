import { prisma } from '../utils/prisma.js';
import { getHandlingFeeConfig, getRewardPointsConfig, isPaymentMethodEnabled } from '../utils/settings.js';
import { applyPromotion } from './promotion.service.js';
import { incrementCouponUse } from './promotion.service.js';

function generateBookingNumber() {
  const segment = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EB-${Date.now().toString(36).toUpperCase()}-${segment()}`;
}

/**
 * Validate items and compute subtotal. Returns { items, subtotal } or throws.
 */
export async function validateAndComputeCart(eventId, items) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, status: 'APPROVED', deletedAt: null },
    include: { ticketTypes: { where: { deletedAt: null } } },
  });
  if (!event) {
    const err = new Error('Event not found or not approved');
    err.statusCode = 404;
    throw err;
  }
  if (event.bookingOpensAt && new Date(event.bookingOpensAt) > new Date()) {
    const err = new Error(`Booking is not open yet. It opens on ${new Date(event.bookingOpensAt).toLocaleString()}`);
    err.statusCode = 400;
    throw err;
  }

  const ticketMap = new Map(event.ticketTypes.map((t) => [t.id, t]));
  const result = [];
  let subtotal = 0;

  for (const { ticketTypeId, quantity } of items) {
    if (!quantity || quantity < 1) continue;
    const tt = ticketMap.get(ticketTypeId);
    if (!tt) {
      const err = new Error(`Invalid ticket type: ${ticketTypeId}`);
      err.statusCode = 400;
      throw err;
    }
    const available = tt.quantity - tt.soldCount;
    if (quantity > available) {
      const err = new Error(`Insufficient quantity for ${tt.name}. Available: ${available}`);
      err.statusCode = 400;
      throw err;
    }
    const unitPrice = Number(tt.price);
    const total = unitPrice * quantity;
    subtotal += total;
    result.push({ ticketTypeId: tt.id, ticketType: tt, quantity, unitPrice, total });
  }

  if (result.length === 0) {
    const err = new Error('No valid ticket items');
    err.statusCode = 400;
    throw err;
  }

  return { event, items: result, subtotal };
}

/**
 * Compute handling fee. isPremium => 0. Otherwise from settings: percentage of subtotal or fixed per ticket.
 */
export async function computeHandlingFee(subtotal, totalTickets, isPremium) {
  if (isPremium) return 0;
  const config = await getHandlingFeeConfig();
  if (config.type === 'percentage') {
    return Math.round((subtotal * config.value) / 100);
  }
  return totalTickets * (config.value || 0);
}

/**
 * Compute points to earn for a booking (for display or after payment).
 */
export async function computePointsEarned(totalAmount) {
  const config = await getRewardPointsConfig();
  if (config.type === 'percentage') {
    return Math.floor((totalAmount * config.value) / 100);
  }
  return config.value || 0;
}

/**
 * Create booking (PENDING), items, and payment record. Returns booking + payment for Stripe.
 * Optional: couponCode, paymentMethod (default STRIPE).
 */
export async function createBooking({ eventId, items, userId, guestEmail, guestName, guestPhone, couponCode, paymentMethod = 'STRIPE' }) {
  const { event, items: validatedItems, subtotal } = await validateAndComputeCart(eventId, items);

  const totalTickets = validatedItems.reduce((s, i) => s + i.quantity, 0);
  let user = null;
  if (userId) {
    user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  }
  const isPremium = user?.isPremium ?? false;
  const isGuest = !userId;

  const { promotionId, discountAmount: promoDiscount, couponId } = await applyPromotion({
    couponCode,
    subtotal,
    validatedItems,
    totalTickets,
    paymentMethod,
    isGuest,
  });

  const handlingFee = await computeHandlingFee(subtotal, totalTickets, isPremium);
  const discountAmount = promoDiscount;
  const pointsRedeemed = 0;
  const total = Math.max(0, subtotal + handlingFee - discountAmount);

  const bookingNumber = generateBookingNumber();
  const existing = await prisma.booking.findUnique({ where: { bookingNumber } });
  if (existing) return createBooking({ eventId, items, userId, guestEmail, guestName, guestPhone, couponCode, paymentMethod });

  const booking = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.create({
      data: {
        bookingNumber,
        eventId,
        userId: userId || null,
        guestEmail: guestEmail?.trim() || null,
        guestName: guestName?.trim() || null,
        guestPhone: guestPhone?.trim() || null,
        status: 'PENDING',
        subtotal,
        handlingFee,
        discountAmount,
        pointsRedeemed,
        pointsEarned: 0,
        total,
        promotionId: promotionId || null,
        couponId: couponId || null,
      },
    });
    for (const it of validatedItems) {
      await tx.bookingItem.create({
        data: {
          bookingId: b.id,
          ticketTypeId: it.ticketTypeId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
        },
      });
    }
    const payment = await tx.payment.create({
      data: {
        bookingId: b.id,
        method: paymentMethod,
        amount: total,
        status: 'PENDING',
      },
    });
    return { booking: b, payment };
  });

  return {
    booking: await prisma.booking.findUnique({
      where: { id: booking.booking.id },
      include: {
        items: { include: { ticketType: true } },
        event: { select: { id: true, title: true, eventDate: true, eventTime: true, location: true } },
        promotion: { select: { id: true, name: true } },
      },
    }),
    payment: booking.payment,
  };
}

/**
 * Confirm booking after successful payment: update booking + payment, increment soldCount, add reward points.
 */
export async function confirmBookingAfterPayment(bookingId) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, status: 'PENDING' },
    include: { items: true, payment: true, userId: true, couponId: true },
  });
  if (!booking) return null;
  if (booking.couponId) await incrementCouponUse(booking.couponId);

  const pointsEarned = await computePointsEarned(Number(booking.total));

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', pointsEarned },
    });
    await tx.payment.update({
      where: { bookingId },
      data: { status: 'COMPLETED', paidAt: new Date() },
    });
    for (const item of booking.items) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { soldCount: { increment: item.quantity } },
      });
    }
    if (booking.userId && pointsEarned > 0) {
      const last = await tx.rewardPoint.findFirst({
        where: { userId: booking.userId },
        orderBy: { createdAt: 'desc' },
      });
      const balance = (last?.balance ?? 0) + pointsEarned;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await tx.rewardPoint.create({
        data: {
          userId: booking.userId,
          points: pointsEarned,
          balance,
          source: 'BOOKING_EARN',
          referenceId: bookingId,
          expiresAt,
        },
      });
    }
  });

  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      items: { include: { ticketType: true } },
      event: true,
      user: { select: { email: true } },
    },
  });
}

export async function getBookingByNumber(bookingNumber, userIdOrGuestEmail) {
  const where = { bookingNumber, deletedAt: null };
  const b = await prisma.booking.findFirst({
    where,
    include: {
      items: { include: { ticketType: true } },
      event: { select: { id: true, title: true, eventDate: true, eventTime: true, location: true, venue: true } },
      payment: true,
    },
  });
  if (!b) return null;
  if (b.userId && b.userId !== userIdOrGuestEmail) return null;
  if (!b.userId && b.guestEmail !== userIdOrGuestEmail) return null;
  return b;
}

export async function getBookingById(bookingId, userIdOrGuestEmail) {
  const b = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    include: {
      items: { include: { ticketType: true } },
      event: { select: { id: true, title: true, eventDate: true, eventTime: true, location: true, venue: true } },
      payment: true,
    },
  });
  if (!b) return null;
  if (b.userId && b.userId !== userIdOrGuestEmail) return null;
  if (!b.userId && b.guestEmail !== userIdOrGuestEmail) return null;
  return b;
}

const userBookingInclude = {
  items: { include: { ticketType: true } },
  event: { select: { id: true, title: true, slug: true, eventDate: true, eventTime: true, location: true } },
  payment: true,
};

export async function listUserBookings(userId) {
  return prisma.booking.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: userBookingInclude,
  });
}

/** Paginated list for customer My Bookings page. */
export async function listUserBookingsPaginated(userId, { page = 1, limit = 10 } = {}) {
  const where = { userId, deletedAt: null };
  const skip = (Math.max(1, page) - 1) * limit;
  const take = Math.min(50, Math.max(1, limit));
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: userBookingInclude,
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total, page, limit };
}

/**
 * List bookings for events organized by organizerId. Pagination, sort, optional status and search.
 */
export async function listBookingsForOrganizer(organizerId, { page = 1, limit = 10, sort = 'createdAt', order = 'desc', status, search } = {}) {
  const where = {
    deletedAt: null,
    event: { organizerId },
  };
  if (status) where.status = status;
  if (search && search.length > 0) {
    where.OR = [
      { bookingNumber: { contains: search, mode: 'insensitive' } },
      { event: { title: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const skip = (Math.max(1, page) - 1) * limit;
  const orderBy = { [sort]: order };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: Math.min(100, Math.max(1, limit)),
      orderBy,
      include: {
        event: { select: { id: true, title: true, slug: true, eventDate: true } },
        items: { include: { ticketType: { select: { name: true } } } },
        payment: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total };
}

/**
 * Admin: list all bookings for an event (customers list). No pagination for export.
 */
export async function listBookingsByEventIdForAdmin(eventId) {
  return prisma.booking.findMany({
    where: { eventId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { ticketType: { select: { name: true } } } },
      payment: true,
    },
  });
}
