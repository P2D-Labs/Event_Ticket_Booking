import * as bookingService from './booking.service.js';
import * as stripeService from './stripe.service.js';
import * as kokoService from './koko.service.js';
import * as mintpayService from './mintpay.service.js';
import { getEnabledPaymentMethodsForEvent } from '../utils/paymentMethods.js';
import { checkoutSchema } from '../utils/validation/checkout.schemas.js';

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';

function bookingPayload(booking) {
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    subtotal: Number(booking.subtotal),
    handlingFee: Number(booking.handlingFee),
    discountAmount: Number(booking.discountAmount),
    total: Number(booking.total),
    items: booking.items,
    event: booking.event,
    promotion: booking.promotion ? { id: booking.promotion.id, name: booking.promotion.name } : null,
  };
}

export async function prepareCheckout(req, res, next) {
  try {
    const body = checkoutSchema.parse(req.body);
    const userId = req.user?.id ?? null;
    const paymentMethod = body.paymentMethod || 'STRIPE';

    if (!userId && (!body.guestEmail || !body.guestName || !body.guestPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Guest checkout requires guestEmail, guestName, and guestPhone',
      });
    }

    const enabledMethods = await getEnabledPaymentMethodsForEvent(body.eventId);
    if (!enabledMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Payment method ${paymentMethod} is not available for this event`,
        enabledMethods,
      });
    }

    const { booking, payment } = await bookingService.createBooking({
      eventId: body.eventId,
      items: body.items,
      userId,
      guestEmail: body.guestEmail,
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      couponCode: body.couponCode,
      paymentMethod,
    });

    if (paymentMethod === 'ON_ENTRY') {
      return res.status(201).json({
        success: true,
        booking: bookingPayload(booking),
        paymentMethod: 'ON_ENTRY',
        message: 'Booking created. Pay at venue.',
      });
    }

    if (paymentMethod === 'STRIPE') {
      const { clientSecret } = await stripeService.createPaymentIntent(booking.id, payment.id);
      return res.status(201).json({
        success: true,
        booking: bookingPayload(booking),
        clientSecret,
        paymentMethod: 'STRIPE',
      });
    }

    if (paymentMethod === 'KOKO') {
      const totalLkr = Math.round(Number(booking.total));
      const { redirectUrl } = await kokoService.createOrder(booking.id, totalLkr, { bookingNumber: booking.bookingNumber });
      return res.status(201).json({
        success: true,
        booking: bookingPayload(booking),
        redirectUrl,
        paymentMethod: 'KOKO',
      });
    }

    if (paymentMethod === 'MINTPAY') {
      const totalLkr = Math.round(Number(booking.total));
      const { redirectUrl } = await mintpayService.createOrder(booking.id, totalLkr, { bookingNumber: booking.bookingNumber });
      return res.status(201).json({
        success: true,
        booking: bookingPayload(booking),
        redirectUrl,
        paymentMethod: 'MINTPAY',
      });
    }

    res.status(400).json({ success: false, message: 'Invalid payment method' });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: e.errors });
    }
    const status = e.statusCode || 500;
    res.status(status).json({ success: false, message: e.message || 'Checkout failed' });
  }
}

export async function getBookingByNumber(req, res, next) {
  try {
    const { number } = req.params;
    const userId = req.user?.id ?? null;
    const guestEmail = req.query.guestEmail ?? req.body?.guestEmail ?? '';
    const identifier = userId || guestEmail;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Provide guestEmail query or be logged in' });
    }
    const booking = await bookingService.getBookingByNumber(number, identifier);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (e) {
    next(e);
  }
}

export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id ?? null;
    const guestEmail = req.query.guestEmail ?? '';
    const identifier = userId || guestEmail;
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Provide guestEmail query or be logged in' });
    }
    const booking = await bookingService.getBookingById(id, identifier);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, booking });
  } catch (e) {
    next(e);
  }
}

export async function listMyBookings(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const result = await bookingService.listUserBookingsPaginated(req.user.id, { page, limit });
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function kokoCallback(req, res, next) {
  try {
    const { bookingId, status } = req.query;
    if (!bookingId || status !== 'success') {
      return res.redirect(`${frontendUrl()}/checkout/success?error=koko_cancelled`);
    }
    const updated = await bookingService.confirmBookingAfterPayment(bookingId);
    const { sendBookingConfirmationToCustomer } = await import('./mail.service.js');
    if (updated) sendBookingConfirmationToCustomer(updated).catch(() => {});
    const number = updated?.bookingNumber;
    return res.redirect(`${frontendUrl()}/checkout/success?number=${encodeURIComponent(number || '')}`);
  } catch (e) {
    next(e);
  }
}

export async function mintpayCallback(req, res, next) {
  try {
    const { bookingId, status } = req.query;
    if (!bookingId || status !== 'success') {
      return res.redirect(`${frontendUrl()}/checkout/success?error=mintpay_cancelled`);
    }
    const updated = await bookingService.confirmBookingAfterPayment(bookingId);
    const { sendBookingConfirmationToCustomer } = await import('./mail.service.js');
    if (updated) sendBookingConfirmationToCustomer(updated).catch(() => {});
    const number = updated?.bookingNumber;
    return res.redirect(`${frontendUrl()}/checkout/success?number=${encodeURIComponent(number || '')}`);
  } catch (e) {
    next(e);
  }
}
