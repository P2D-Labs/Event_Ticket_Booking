import { prisma } from '../utils/prisma.js';

export async function listTestimonialsHandler(req, res, next) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, testimonials });
  } catch (e) {
    next(e);
  }
}

export async function createTestimonialHandler(req, res, next) {
  try {
    const { author, content, avatarUrl, rating, isActive } = req.body;
    if (!author || !content) {
      return res.status(400).json({ success: false, message: 'author and content required' });
    }
    const testimonial = await prisma.testimonial.create({
      data: {
        author: String(author).trim(),
        content: String(content).trim(),
        avatarUrl: avatarUrl ? String(avatarUrl).trim() : null,
        rating: rating != null ? Math.min(5, Math.max(1, Number(rating))) : null,
        isActive: isActive !== false,
      },
    });
    res.status(201).json({ success: true, testimonial });
  } catch (e) {
    next(e);
  }
}

export async function updateTestimonialHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { author, content, avatarUrl, rating, isActive } = req.body;
    const data = {};
    if (author !== undefined) data.author = String(author).trim();
    if (content !== undefined) data.content = String(content).trim();
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    if (rating !== undefined) data.rating = rating != null ? Math.min(5, Math.max(1, Number(rating))) : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    const testimonial = await prisma.testimonial.update({ where: { id }, data });
    res.json({ success: true, testimonial });
  } catch (e) {
    next(e);
  }
}

export async function deleteTestimonialHandler(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

/** User-submitted testimonial from profile (isActive: false until admin approves) */
export async function submitTestimonialHandler(req, res, next) {
  try {
    const { content, rating } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    const author = req.user?.name || req.user?.email || 'Guest';
    const testimonial = await prisma.testimonial.create({
      data: {
        author: String(author).trim(),
        content: String(content).trim().slice(0, 2000),
        avatarUrl: null,
        rating: rating != null ? Math.min(5, Math.max(1, Number(rating))) : null,
        isActive: false,
      },
    });
    res.status(201).json({ success: true, testimonial, message: 'Thank you! Your testimonial will appear after review.' });
  } catch (e) {
    next(e);
  }
}
