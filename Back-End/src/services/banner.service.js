import { prisma } from '../utils/prisma.js';

export async function listBannersHandler(req, res, next) {
  try {
    const banners = await prisma.banner.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, banners });
  } catch (err) {
    next(err);
  }
}

export async function createBannerHandler(req, res, next) {
  try {
    const { title, subtitle, imageUrl, linkUrl, buttonLabel, sortOrder, isActive } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'imageUrl required' });
    }
    const banner = await prisma.banner.create({
      data: {
        title: title ? String(title).trim() : null,
        subtitle: subtitle ? String(subtitle).trim() : null,
        imageUrl: String(imageUrl).trim(),
        linkUrl: linkUrl ? String(linkUrl).trim() : null,
        buttonLabel: buttonLabel ? String(buttonLabel).trim() : null,
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== false,
      },
    });
    res.status(201).json({ success: true, banner });
  } catch (err) {
    next(err);
  }
}

export async function updateBannerHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, linkUrl, buttonLabel, sortOrder, isActive } = req.body;
    const data = {};
    if (title !== undefined) data.title = title ? String(title).trim() : null;
    if (subtitle !== undefined) data.subtitle = subtitle ? String(subtitle).trim() : null;
    if (imageUrl !== undefined) data.imageUrl = String(imageUrl).trim();
    if (linkUrl !== undefined) data.linkUrl = linkUrl ? String(linkUrl).trim() : null;
    if (buttonLabel !== undefined) data.buttonLabel = buttonLabel ? String(buttonLabel).trim() : null;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    const banner = await prisma.banner.update({ where: { id }, data });
    res.json({ success: true, banner });
  } catch (err) {
    next(err);
  }
}

export async function deleteBannerHandler(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.banner.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
