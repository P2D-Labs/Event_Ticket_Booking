import { prisma } from '../utils/prisma.js';

export async function listOrganizersHandler(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null, role: { in: ['ORGANIZER', 'SUPER_ADMIN'] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, organizers: users });
  } catch (e) {
    next(e);
  }
}
