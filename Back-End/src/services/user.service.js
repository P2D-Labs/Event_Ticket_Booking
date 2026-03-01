import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';

const SALT_ROUNDS = 12;

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isPremium: true,
  avatarUrl: true,
  organization: true,
  createdAt: true,
  updatedAt: true,
};

export async function updateProfileHandler(req, res, next) {
  try {
    const { name, phone, avatarUrl, organization } = req.body;
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (phone !== undefined) data.phone = String(phone).trim();
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    if (organization !== undefined) data.organization = organization ? String(organization).trim() : null;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: userSelect,
    });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function becomeOrganizerHandler(req, res, next) {
  try {
    if (req.user.role !== 'CUSTOMER') {
      return res.status(400).json({
        success: false,
        message: 'Only customers can use this. You are already an organizer or admin.',
      });
    }
    const { organization } = req.body || {};
    const updateData = { role: 'ORGANIZER' };
    if (organization !== undefined && organization !== null && String(organization).trim()) {
      updateData.organization = String(organization).trim();
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: userSelect,
    });
    res.json({ success: true, user, message: 'You are now an organizer. You can create and manage events from the Dashboard.' });
  } catch (err) {
    next(err);
  }
}

// ---------- Admin (SUPER_ADMIN only) ----------

export async function listAdminUsersHandler(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const search = (req.query.search || '').trim();
    const where = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { ...userSelect },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({
      success: true,
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUserByIdHandler(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { ...userSelect },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUserBookingsHandler(req, res, next) {
  try {
    const { id: userId } = req.params;
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const where = { userId, deletedAt: null };
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          event: { select: { id: true, title: true, slug: true, eventDate: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    const list = bookings.map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      eventId: b.eventId,
      eventTitle: b.event?.title,
      eventSlug: b.event?.slug,
      eventDate: b.event?.eventDate,
      status: b.status,
      total: Number(b.total),
      createdAt: b.createdAt,
    }));
    res.json({
      success: true,
      bookings: list,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUserEventsHandler(req, res, next) {
  try {
    const { id: userId } = req.params;
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const where = { organizerId: userId, deletedAt: null };
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          eventDate: true,
          createdAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);
    res.json({
      success: true,
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, avatarUrl, organization, role, isPremium } = req.body;
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (phone !== undefined) data.phone = String(phone).trim();
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    if (organization !== undefined) data.organization = organization ? String(organization).trim() : null;
    if (role !== undefined && ['CUSTOMER', 'ORGANIZER', 'SUPER_ADMIN'].includes(role)) data.role = role;
    if (typeof isPremium === 'boolean') data.isPremium = isPremium;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    next(err);
  }
}

export async function resetAdminUserPasswordHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    res.json({ success: true, message: 'Password has been reset.' });
  } catch (err) {
    next(err);
  }
}
