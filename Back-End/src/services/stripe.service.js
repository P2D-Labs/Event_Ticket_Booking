import Stripe from 'stripe';
import { prisma } from '../utils/prisma.js';
import { confirmBookingAfterPayment } from './booking.service.js';
import { syncSubscriptionFromStripe, refreshUserPremium } from './subscription.service.js';
import { getFeaturedEventConfig } from '../utils/settings.js';

const secret = process.env.STRIPE_SECRET_KEY;
export const stripe = secret ? new Stripe(secret) : null;

/**
 * Create a PaymentIntent for a booking (amount in LKR - Stripe zero-decimal).
 * Returns { clientSecret }.
 */
export async function createPaymentIntent(bookingId, paymentId) {
  if (!stripe) {
    const err = new Error('Stripe is not configured');
    err.statusCode = 503;
    throw err;
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, status: 'PENDING' },
    include: { payment: true },
  });
  if (!booking || !booking.payment || booking.payment.id !== paymentId) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }
  if (booking.payment.status !== 'PENDING') {
    const err = new Error('Payment already processed');
    err.statusCode = 400;
    throw err;
  }

  const amountLkr = Math.round(Number(booking.total));
  const intent = await stripe.paymentIntents.create({
    amount: amountLkr, // LKR is zero-decimal
    currency: 'lkr',
    automatic_payment_methods: { enabled: true },
    metadata: { bookingId, paymentId: booking.payment.id },
  });

  await prisma.payment.update({
    where: { id: paymentId },
    data: { stripeIntentId: intent.id },
  });

  return { clientSecret: intent.client_secret };
}

/**
 * Create a PaymentIntent for featuring an event (admin-configured price). Organizer pays to show event in Featured section.
 * Returns { clientSecret }. Metadata: type=feature, eventId (webhook creates EventFeature on success).
 */
export async function createFeaturePaymentIntent(eventId, userId) {
  if (!stripe) {
    const err = new Error('Stripe is not configured');
    err.statusCode = 503;
    throw err;
  }
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: userId, status: 'APPROVED', deletedAt: null },
  });
  if (!event) {
    const err = new Error('Event not found or not approved');
    err.statusCode = 404;
    throw err;
  }
  const config = await getFeaturedEventConfig();
  const amountLkr = Math.round(Number(config.price) || 0);
  if (amountLkr <= 0) {
    const err = new Error('Featured event pricing is not configured by admin');
    err.statusCode = 400;
    throw err;
  }
  const intent = await stripe.paymentIntents.create({
    amount: amountLkr,
    currency: 'lkr',
    automatic_payment_methods: { enabled: true },
    metadata: { type: 'feature', eventId },
  });
  return { clientSecret: intent.client_secret, amount: amountLkr };
}

/**
 * Verify webhook signature and handle payment_intent.succeeded.
 */
export async function handleStripeWebhook(rawBody, signature) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    const err = new Error('Stripe webhook not configured');
    err.statusCode = 503;
    throw err;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    const err = new Error('Invalid webhook signature');
    err.statusCode = 400;
    throw err;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    if (pi.metadata?.type === 'feature' && pi.metadata?.eventId) {
      const eventId = pi.metadata.eventId;
      const config = await getFeaturedEventConfig();
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setDate(endsAt.getDate() + (config.durationDays || 14));
      await prisma.eventFeature.create({
        data: {
          eventId,
          startsAt: now,
          endsAt,
          amountPaid: pi.amount / 100,
          stripePaymentId: pi.id,
        },
      });
      return { received: true };
    }
    const bookingId = pi.metadata?.bookingId;
    if (bookingId) {
      const updated = await confirmBookingAfterPayment(bookingId);
      const { sendBookingConfirmationToCustomer } = await import('./mail.service.js');
      if (updated) sendBookingConfirmationToCustomer(updated).catch(() => {});
    }
    const payment = await prisma.payment.findFirst({ where: { stripeIntentId: pi.id } });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripePaymentId: pi.id },
      });
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'subscription' && session.subscription) {
      const userId = session.metadata?.userId;
      if (session.customer && userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer.id },
        }).catch(() => {});
      }
      const sub = await stripe.subscriptions.retrieve(session.subscription, { expand: ['default_payment_method'] });
      await syncSubscriptionFromStripe(sub);
    }
  }

  if (event.type === 'customer.subscription.updated') {
    await syncSubscriptionFromStripe(event.data.object);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const existing = await prisma.subscription.findFirst({ where: { stripeSubId: sub.id } });
    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { status: 'cancelled', cancelledAt: new Date() },
      });
      await refreshUserPremium(existing.userId);
    }
  }

  return { received: true };
}

export async function webhookHandler(req, res) {
  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).send('Missing Stripe signature');
  }
  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).send('Raw body required');
  }
  try {
    await handleStripeWebhook(rawBody, signature);
    res.json({ received: true });
  } catch (e) {
    res.status(e.statusCode || 500).send(e.message || 'Webhook error');
  }
}
