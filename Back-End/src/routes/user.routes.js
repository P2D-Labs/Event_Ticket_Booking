import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as userService from '../services/user.service.js';

const router = Router();
router.use(authenticate);

router.patch('/me', userService.updateProfileHandler);
router.post('/me/become-organizer', userService.becomeOrganizerHandler);

// Admin (SUPER_ADMIN only) - more specific routes first
router.get('/admin', requireRoles('SUPER_ADMIN'), userService.listAdminUsersHandler);
router.get('/admin/:id/bookings', requireRoles('SUPER_ADMIN'), userService.getAdminUserBookingsHandler);
router.get('/admin/:id/events', requireRoles('SUPER_ADMIN'), userService.getAdminUserEventsHandler);
router.get('/admin/:id', requireRoles('SUPER_ADMIN'), userService.getAdminUserByIdHandler);
router.patch('/admin/:id/reset-password', requireRoles('SUPER_ADMIN'), userService.resetAdminUserPasswordHandler);
router.patch('/admin/:id', requireRoles('SUPER_ADMIN'), userService.updateAdminUserHandler);

export default router;
