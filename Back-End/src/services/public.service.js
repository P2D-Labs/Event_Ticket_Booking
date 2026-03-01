import { prisma } from '../utils/prisma.js';
import { getEnabledPaymentMethodsList } from '../utils/settings.js';
import * as eventService from './event.service.js';

export async function getBannersHandler(req, res, next) {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, banners });
  } catch (e) {
    next(e);
  }
}

export async function getTestimonialsHandler(req, res, next) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ success: true, testimonials });
  } catch (e) {
    next(e);
  }
}

export async function getCategoriesHandler(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, categories });
  } catch (e) {
    next(e);
  }
}

export async function getFeaturedEventsHandler(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const events = await eventService.listFeaturedEvents(limit);
    res.json({ success: true, events });
  } catch (e) {
    next(e);
  }
}

export async function getComingSoonEventsHandler(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const events = await eventService.listComingSoonEvents(limit);
    res.json({ success: true, events });
  } catch (e) {
    next(e);
  }
}

export async function getPaymentMethodsHandler(req, res, next) {
  try {
    const methods = await getEnabledPaymentMethodsList();
    res.json({ success: true, paymentMethods: methods });
  } catch (e) {
    next(e);
  }
}
