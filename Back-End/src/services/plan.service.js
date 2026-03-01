import { prisma } from '../utils/prisma.js';

export async function listPlansHandler(req, res, next) {
  try {
    const plans = await prisma.premiumPlan.findMany({
      where: { deletedAt: null },
      orderBy: { price: 'asc' },
      include: { _count: { select: { subscriptions: true } } },
    });
    res.json({ success: true, plans });
  } catch (e) {
    next(e);
  }
}

export async function createPlanHandler(req, res, next) {
  try {
    const { name, price, duration } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ success: false, message: 'name and price required' });
    }
    const plan = await prisma.premiumPlan.create({
      data: {
        name: String(name).trim(),
        price: Number(price),
        duration: (duration || 'MONTHLY').toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        isActive: true,
      },
    });
    res.status(201).json({ success: true, plan });
  } catch (e) {
    next(e);
  }
}

export async function updatePlanHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { name, price, duration, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (price !== undefined) data.price = Number(price);
    if (duration !== undefined) data.duration = duration.toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    const plan = await prisma.premiumPlan.update({ where: { id }, data });
    res.json({ success: true, plan });
  } catch (e) {
    next(e);
  }
}
