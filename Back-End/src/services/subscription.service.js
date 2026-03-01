import Stripe from 'stripe';
import { prisma } from '../utils/prisma.js';

const secret = process.env.STRIPE_SECRET_KEY;
const stripe = secret ? new Stripe(secret) : null;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Get or create Stripe Price for a plan (LKR recurring). Saves stripePriceId to plan if created.
 */
export async function getOrCreateStripePrice(plan) {
  if (!stripe) return null;
  if (plan.stripePriceId) return plan.stripePriceId;

  const amountLkr = Math.round(Number(plan.price));
  const interval = (plan.duration || 'MONTHLY').toLowerCase() === 'yearly' ? 'year' : 'month';

  const price = await stripe.prices.create({
    currency: 'lkr',
    unit_amount: amountLkr,
    recurring: { interval },
    product_data: {
      name: plan.name,
      metadata: { planId: plan.id },
    },
  });

  await prisma.premiumPlan.update({
    where: { id: plan.id },
    data: { stripePriceId: price.id },
  });
  return price.id;
}

/**
 * Create Stripe Checkout Session for subscription. Returns { url }.
 */
export async function createCheckoutSession(userId, planId) {
  if (!stripe) {
    const err = new Error('Stripe is not configured');
    err.statusCode = 503;
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const plan = await prisma.premiumPlan.findFirst({
    where: { id: planId, isActive: true, deletedAt: null },
  });
  if (!plan) {
    const err = new Error('Plan not found or inactive');
    err.statusCode = 404;
    throw err;
  }

  const priceId = await getOrCreateStripePrice(plan);
  if (!priceId) {
    const err = new Error('Could not create Stripe price');
    err.statusCode = 503;
    throw err;
  }

  const sessionConfig = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${FRONTEND_URL}/premium?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/premium?canceled=1`,
    metadata: { userId, planId },
    subscription_data: { metadata: { userId, planId } },
  };

  if (user.stripeCustomerId) {
    sessionConfig.customer = user.stripeCustomerId;
  } else {
    sessionConfig.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return { url: session.url };
}

/**
 * Sync Subscription and user.isPremium from Stripe subscription object.
 */
export async function syncSubscriptionFromStripe(stripeSubscription) {
  const sub = stripeSubscription;
  const userId = sub.metadata?.userId;
  const planId = sub.metadata?.planId;
  if (!userId || !planId) return;

  const isActive = sub.status === 'active';
  const currentPeriodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000) : null;
  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.subscription.findFirst({
      where: { stripeSubId: sub.id },
    });
    if (existing) {
      await tx.subscription.update({
        where: { id: existing.id },
        data: {
          status: sub.status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        },
      });
    } else {
      await tx.subscription.create({
        data: {
          userId,
          planId,
          stripeSubId: sub.id,
          status: sub.status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        },
      });
    }

    const activeSubs = await tx.subscription.count({
      where: { userId, status: 'active' },
    });
    await tx.user.update({
      where: { id: userId },
      data: { isPremium: activeSubs > 0 },
    });
  });
}

/**
 * Set user.isPremium from current subscriptions.
 */
export async function refreshUserPremium(userId) {
  const activeCount = await prisma.subscription.count({
    where: { userId, status: 'active' },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: activeCount > 0 },
  });
}

/**
 * Get current subscription for user.
 */
export async function getMySubscription(userId) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { currentPeriodEnd: 'desc' },
    include: { plan: true },
  });
  return sub;
}

/**
 * Cancel subscription at period end (Stripe).
 */
export async function cancelSubscription(userId) {
  if (!stripe) {
    const err = new Error('Stripe is not configured');
    err.statusCode = 503;
    throw err;
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { currentPeriodEnd: 'desc' },
  });
  if (!sub || !sub.stripeSubId) {
    const err = new Error('No active subscription');
    err.statusCode = 404;
    throw err;
  }

  await stripe.subscriptions.update(sub.stripeSubId, { cancel_at_period_end: true });
  return { message: 'Subscription will cancel at end of billing period' };
}

export async function listPlansHandler(req, res, next) {
  try {
    const plans = await prisma.premiumPlan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { price: 'asc' },
    });
    res.json({ success: true, plans });
  } catch (e) {
    next(e);
  }
}

export async function createCheckoutSessionHandler(req, res, next) {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ success: false, message: 'planId required' });
    }
    const { url } = await createCheckoutSession(req.user.id, planId);
    res.json({ success: true, url });
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ success: false, message: e.message || 'Failed to create session' });
  }
}

export async function getMySubscriptionHandler(req, res, next) {
  try {
    const subscription = await getMySubscription(req.user.id);
    res.json({ success: true, subscription });
  } catch (e) {
    next(e);
  }
}

export async function cancelSubscriptionHandler(req, res, next) {
  try {
    const result = await cancelSubscription(req.user.id);
    res.json({ success: true, ...result });
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ success: false, message: e.message || 'Failed to cancel' });
  }
}
