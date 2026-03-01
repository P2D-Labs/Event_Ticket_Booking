import { prisma } from '../utils/prisma.js';
import { slugify } from '../utils/slug.js';

export async function listCategoriesHandler(req, res, next) {
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

export async function createCategoryHandler(req, res, next) {
  try {
    const { name, description } = req.body;
    const slug = slugify(name || '');
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Invalid name' });
    }
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category slug already exists' });
    }
    const category = await prisma.category.create({
      data: { name: (name || '').trim(), slug, description: description?.trim() || null },
    });
    res.status(201).json({ success: true, category });
  } catch (e) {
    next(e);
  }
}

export async function updateCategoryHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name.trim();
      updateData.slug = slugify(name);
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });
    res.json({ success: true, category });
  } catch (e) {
    next(e);
  }
}

export async function deleteCategoryHandler(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}
