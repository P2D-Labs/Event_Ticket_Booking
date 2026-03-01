import { prisma } from '../utils/prisma.js';
import { uniqueSlug } from '../utils/slug.js';
import { createEventSchema, updateEventSchema } from '../utils/validation/event.schemas.js';
import { getEnabledPaymentMethodsForEvent } from '../utils/paymentMethods.js';
import { getFeaturedEventConfig, getEnabledPaymentMethodsList } from '../utils/settings.js';
import * as bookingService from './booking.service.js';
import * as stripeService from './stripe.service.js';

/** Returns true if userId is an ORGANIZER or SUPER_ADMIN (can own events) */
export async function validateOrganizerId(userId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { role: true },
  });
  return user && (user.role === 'ORGANIZER' || user.role === 'SUPER_ADMIN');
}

export async function createEvent(organizerId, data) {
  const slugs = await prisma.event.findMany({ where: { deletedAt: null }, select: { slug: true } });
  const slug = uniqueSlug(data.title, slugs.map((s) => s.slug));
  const allowedPaymentMethods = data.paymentMethods && Array.isArray(data.paymentMethods) ? await getEnabledPaymentMethodsList() : [];

  const event = await prisma.$transaction(async (tx) => {
    const e = await tx.event.create({
      data: {
        title: data.title.trim(),
        slug,
        description: data.description.trim(),
        location: data.location.trim(),
        venue: data.venue?.trim() || null,
        eventDate: new Date(data.eventDate),
        eventTime: data.eventTime?.trim() || null,
        coverImage: data.coverImage.trim(),
        seatingImage: data.seatingImage?.trim() || null,
        categoryId: data.categoryId || null,
        organizerId,
        status: 'PENDING',
        bookingOpensAt: data.bookingOpensAt ? new Date(data.bookingOpensAt) : null,
      },
    });
    if (data.ticketTypes?.length) {
      await tx.ticketType.createMany({
        data: data.ticketTypes.map((tt) => ({
          eventId: e.id,
          name: tt.name.trim(),
          price: tt.price,
          quantity: tt.quantity,
        })),
      });
    }
    if (data.paymentMethods && Array.isArray(data.paymentMethods) && allowedPaymentMethods.length > 0) {
      for (const method of allowedPaymentMethods) {
        await tx.eventPaymentMethod.upsert({
          where: { eventId_paymentMethod: { eventId: e.id, paymentMethod: method } },
          create: { eventId: e.id, paymentMethod: method, enabled: data.paymentMethods.includes(method) },
          update: { enabled: data.paymentMethods.includes(method) },
        });
      }
    }
    return tx.event.findUnique({
      where: { id: e.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        ticketTypes: true,
      },
    });
  });
  return event;
}

export async function updateEvent(eventId, organizerId, data) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
  });
  if (!event) return null;

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.location !== undefined) updateData.location = data.location.trim();
  if (data.venue !== undefined) updateData.venue = data.venue?.trim() || null;
  if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
  if (data.eventTime !== undefined) updateData.eventTime = data.eventTime?.trim() || null;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage.trim();
  if (data.seatingImage !== undefined) updateData.seatingImage = data.seatingImage?.trim() || null;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;

  if (data.status) {
    // Only admin can change status; organizer cannot set approved
    updateData.status = data.status;
  }
  if (data.bookingOpensAt !== undefined) updateData.bookingOpensAt = data.bookingOpensAt ? new Date(data.bookingOpensAt) : null;

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      ticketTypes: true,
    },
  });

  if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
    const allowed = await getEnabledPaymentMethodsList();
    for (const method of allowed) {
      await prisma.eventPaymentMethod.upsert({
        where: { eventId_paymentMethod: { eventId, paymentMethod: method } },
        create: { eventId, paymentMethod: method, enabled: data.paymentMethods.includes(method) },
        update: { enabled: data.paymentMethods.includes(method) },
      });
    }
  }
  return updated;
}

export async function listEventsForOrganizer(organizerId, query) {
  const where = { organizerId, deletedAt: null };
  if (query.status) where.status = query.status;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 15));
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        ticketTypes: true,
      },
      orderBy: { eventDate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);
  const featuredIds = await getFeaturedEventIds();
  const eventsWithFeatured = events.map((e) => ({ ...e, isFeatured: featuredIds.has(e.id) }));
  return { events: eventsWithFeatured, total, page, limit };
}

export async function listEventsPublic(query) {
  const now = new Date();
  const where = { status: 'APPROVED', deletedAt: null };
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
  if (query.fromDate) where.eventDate = { gte: new Date(query.fromDate) };
  if (query.toDate) where.eventDate = { ...where.eventDate, lte: new Date(query.toDate) };
  if (query.comingSoon === '1' || query.comingSoon === true) {
    where.bookingOpensAt = { not: null, gt: now };
  }
  if (query.featured === '1' || query.featured === true) {
    const features = await prisma.eventFeature.findMany({
      where: { startsAt: { lte: now }, endsAt: { gte: now } },
      select: { eventId: true },
    });
    const featuredIds = [...new Set(features.map((f) => f.eventId))];
    if (featuredIds.length === 0) {
      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
      return { events: [], total: 0, page, limit };
    }
    where.id = { in: featuredIds };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));

  const events = await prisma.event.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      ticketTypes: { where: { deletedAt: null }, select: { id: true, name: true, price: true, quantity: true, soldCount: true } },
    },
    orderBy: { eventDate: 'asc' },
    take: 500,
  });

  // Optional price filter in memory
  let filtered = events;
  if (query.minPrice != null) {
    const min = Number(query.minPrice);
    filtered = filtered.filter((e) => e.ticketTypes.some((t) => Number(t.price) >= min));
  }
  if (query.maxPrice != null) {
    const max = Number(query.maxPrice);
    filtered = filtered.filter((e) => e.ticketTypes.some((t) => Number(t.price) <= max));
  }

  // Attach isFeatured and sort: featured first, then by eventDate
  const featureRows = await prisma.eventFeature.findMany({
    where: { startsAt: { lte: now }, endsAt: { gte: now } },
    select: { eventId: true },
  });
  const featuredIds = new Set(featureRows.map((r) => r.eventId));
  const withFeatured = filtered.map((e) => ({ ...e, isFeatured: featuredIds.has(e.id) }));
  withFeatured.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return new Date(a.eventDate) - new Date(b.eventDate);
  });

  const total = withFeatured.length;
  const start = (page - 1) * limit;
  const paginated = withFeatured.slice(start, start + limit);
  return { events: paginated, total, page, limit };
}

const eventPublicInclude = {
  category: { select: { id: true, name: true, slug: true } },
  ticketTypes: { where: { deletedAt: null }, select: { id: true, name: true, price: true, quantity: true, soldCount: true } },
};

/** Events currently featured (have active EventFeature, APPROVED). For home page. */
export async function listFeaturedEvents(limit = 10) {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null,
      eventFeatures: {
        some: {
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      },
    },
    include: eventPublicInclude,
    orderBy: { eventDate: 'asc' },
    take: limit,
  });
  return events;
}

/** APPROVED events where bookingOpensAt is in the future. For home "Coming soon" section. */
export async function listComingSoonEvents(limit = 10) {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null,
      bookingOpensAt: { not: null, gt: now },
    },
    include: eventPublicInclude,
    orderBy: { bookingOpensAt: 'asc' },
    take: limit,
  });
  return events;
}

export async function getEventBySlugOrId(slugOrId, forPublic = false) {
  const isId = slugOrId.length === 25 && slugOrId.startsWith('c');
  const where = isId ? { id: slugOrId } : { slug: slugOrId };
  if (forPublic) where.status = 'APPROVED';
  where.deletedAt = null;

  const event = await prisma.event.findFirst({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      ticketTypes: { where: { deletedAt: null } },
      organizer: {
        select: { id: true, name: true, organization: true },
      },
    },
  });
  return event;
}

export async function getEventByIdForOrganizer(eventId, organizerId) {
  return prisma.event.findFirst({
    where: { id: eventId, organizerId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      ticketTypes: true,
      eventPaymentMethods: true,
    },
  });
}

/** Set of event IDs that are currently featured (active EventFeature window). */
export async function getFeaturedEventIds() {
  const now = new Date();
  const rows = await prisma.eventFeature.findMany({
    where: { startsAt: { lte: now }, endsAt: { gte: now } },
    select: { eventId: true },
  });
  return new Set(rows.map((r) => r.eventId));
}

/** Admin: get any event by id (not soft-deleted). */
export async function getEventByIdAdmin(eventId) {
  return prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      ticketTypes: true,
      organizer: { select: { id: true, name: true, email: true } },
      eventPaymentMethods: true,
    },
  });
}

/** Admin: soft delete event (set deletedAt). */
export async function softDeleteEvent(eventId) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) return null;
  return prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
  });
}

export async function adminApproveEvent(eventId, status, rejectedReason) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) return null;
  return prisma.event.update({
    where: { id: eventId },
    data: {
      status: status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
      rejectedReason: status === 'REJECTED' ? (rejectedReason || null) : null,
    },
    include: {
      category: true,
      ticketTypes: true,
      organizer: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listOrganizerMineHandler(req, res, next) {
  try {
    const result = await listEventsForOrganizer(req.user.id, req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function listOrganizerBookingsHandler(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const sort = ['createdAt', 'total', 'bookingNumber'].includes(req.query.sort) ? req.query.sort : 'createdAt';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';
    const status = ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(req.query.status) ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : undefined;
    const { bookings, total } = await bookingService.listBookingsForOrganizer(req.user.id, { page, limit, sort, order, status, search });
    res.json({ success: true, bookings, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function getOrganizerEventByIdHandler(req, res, next) {
  try {
    const { id } = req.params;
    const event = await getEventByIdForOrganizer(id, req.user.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const featuredIds = await getFeaturedEventIds();
    const eventWithFeatured = { ...event, isFeatured: featuredIds.has(event.id) };
    res.json({ success: true, event: eventWithFeatured });
  } catch (e) {
    next(e);
  }
}

export async function listPublicHandler(req, res, next) {
  try {
    const result = await listEventsPublic(req.query);
    res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function getPaymentMethodsHandler(req, res, next) {
  try {
    const { eventId } = req.params;
    const event = await getEventBySlugOrId(eventId, true);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const enabledMethods = await getEnabledPaymentMethodsForEvent(event.id);
    res.json({ success: true, enabledMethods });
  } catch (e) {
    next(e);
  }
}

export async function getBySlugOrIdHandler(req, res, next) {
  try {
    const { slugOrId } = req.params;
    const event = await getEventBySlugOrId(slugOrId, true);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const featuredIds = await getFeaturedEventIds();
    const eventWithFeatured = { ...event, isFeatured: featuredIds.has(event.id) };
    res.json({ success: true, event: eventWithFeatured });
  } catch (e) {
    next(e);
  }
}

export async function createEventHandler(req, res, next) {
  try {
    const body = createEventSchema.parse(req.body);
    let organizerId = req.user.id;
    if (req.user.role === 'SUPER_ADMIN' && body.organizerId) {
      organizerId = body.organizerId;
      const ok = await validateOrganizerId(organizerId);
      if (!ok) {
        return res.status(400).json({ success: false, message: 'Invalid organizer' });
      }
    }
    const { organizerId: _oid, ...rest } = body;
    const event = await createEvent(organizerId, {
      ...rest,
      eventDate: body.eventDate,
    });
    res.status(201).json({ success: true, event });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: e.errors });
    }
    next(e);
  }
}

export async function updateEventHandler(req, res, next) {
  try {
    const { id } = req.params;
    const body = updateEventSchema.parse(req.body);
    const existing = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, organizerId: true, status: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Event not found' });
    if (req.user.role === 'SUPER_ADMIN') {
      const event = await updateEvent(id, existing.organizerId, body);
      return res.json({ success: true, event });
    }
    if (existing.organizerId !== req.user.id) return res.status(404).json({ success: false, message: 'Event not found' });
    if (existing.status !== 'PENDING') {
      return res.status(403).json({ success: false, message: 'Only pending events can be edited. Contact admin for approval changes.' });
    }
    const event = await updateEvent(id, req.user.id, body);
    res.json({ success: true, event });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: e.errors });
    }
    next(e);
  }
}

export async function listAdminEventsHandler(req, res, next) {
  try {
    const status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const where = { deletedAt: null };
    if (status) where.status = status;
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          ticketTypes: true,
          organizer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);
    const featuredIds = await getFeaturedEventIds();
    const eventsWithFeatured = events.map((e) => ({ ...e, isFeatured: featuredIds.has(e.id) }));
    res.json({ success: true, events: eventsWithFeatured, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function approveEventHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { status, rejectedReason } = req.body;
    const event = await adminApproveEvent(id, status, rejectedReason);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const { sendEventApprovedToOrganizer, sendEventRejectedToOrganizer } = await import('./mail.service.js');
    if (status === 'APPROVED') {
      sendEventApprovedToOrganizer(event).catch(() => {});
    } else if (status === 'REJECTED') {
      sendEventRejectedToOrganizer(event, rejectedReason).catch(() => {});
    }
    res.json({ success: true, event });
  } catch (e) {
    next(e);
  }
}

export async function getAdminEventByIdHandler(req, res, next) {
  try {
    const { id } = req.params;
    const event = await getEventByIdAdmin(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const featuredIds = await getFeaturedEventIds();
    const eventWithFeatured = { ...event, isFeatured: featuredIds.has(event.id) };
    res.json({ success: true, event: eventWithFeatured });
  } catch (e) {
    next(e);
  }
}

export async function softDeleteEventHandler(req, res, next) {
  try {
    const { id } = req.params;
    const event = await softDeleteEvent(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (e) {
    next(e);
  }
}

export async function getFeaturedConfigHandler(req, res, next) {
  try {
    const config = await getFeaturedEventConfig();
    res.json({ success: true, config: { price: config.price, durationDays: config.durationDays } });
  } catch (e) {
    next(e);
  }
}

export async function createFeaturePaymentIntentHandler(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const { clientSecret, amount } = await stripeService.createFeaturePaymentIntent(eventId, req.user.id);
    res.json({ success: true, clientSecret, amount });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message });
    next(e);
  }
}

export async function listEventBookingsForAdminHandler(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const event = await getEventByIdAdmin(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const bookingService = await import('./booking.service.js');
    const bookings = await bookingService.listBookingsByEventIdForAdmin(eventId);
    const rows = bookings.map((b) => {
      const name = b.guestName || b.user?.name || '';
      const email = b.guestEmail || b.user?.email || '';
      const phone = b.guestPhone || b.user?.phone || '';
      const ticketSummary = (b.items || []).map((i) => `${i.quantity}x ${i.ticketType?.name || ''}`).join('; ');
      return {
        bookingNumber: b.bookingNumber,
        customerName: name,
        email,
        phone,
        status: b.status,
        total: Number(b.total),
        ticketSummary,
        createdAt: b.createdAt,
      };
    });
    res.json({ success: true, eventTitle: event.title, bookings: rows });
  } catch (e) {
    next(e);
  }
}

function escapeCsvCell(s) {
  const str = String(s == null ? '' : s);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function exportEventBookingsCsvHandler(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const event = await getEventByIdAdmin(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const bookingService = await import('./booking.service.js');
    const bookings = await bookingService.listBookingsByEventIdForAdmin(eventId);
    const headers = ['Booking Number', 'Customer Name', 'Email', 'Phone', 'Status', 'Total (LKR)', 'Tickets', 'Created At'];
    const rows = bookings.map((b) => {
      const name = b.guestName || b.user?.name || '';
      const email = b.guestEmail || b.user?.email || '';
      const phone = b.guestPhone || b.user?.phone || '';
      const ticketSummary = (b.items || []).map((i) => `${i.quantity}x ${i.ticketType?.name || ''}`).join('; ');
      return [
        escapeCsvCell(b.bookingNumber),
        escapeCsvCell(name),
        escapeCsvCell(email),
        escapeCsvCell(phone),
        escapeCsvCell(b.status),
        escapeCsvCell(Number(b.total)),
        escapeCsvCell(ticketSummary),
        escapeCsvCell(new Date(b.createdAt).toISOString()),
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\r\n');
    const filename = `event-${(event.title || eventId).replace(/[^a-z0-9-_]/gi, '-')}-bookings.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (e) {
    next(e);
  }
}
