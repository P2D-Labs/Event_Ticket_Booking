import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as eventService from '../services/event.service.js';

const router = Router();

router.get('/feature-config', eventService.getFeaturedConfigHandler);
router.get('/organizer/mine', authenticate, requireRoles('ORGANIZER', 'SUPER_ADMIN'), eventService.listOrganizerMineHandler);
router.get('/organizer/bookings/list', authenticate, requireRoles('ORGANIZER', 'SUPER_ADMIN'), eventService.listOrganizerBookingsHandler);
router.get('/organizer/:id', authenticate, requireRoles('ORGANIZER', 'SUPER_ADMIN'), eventService.getOrganizerEventByIdHandler);
router.post('/:id/feature-payment-intent', authenticate, requireRoles('ORGANIZER', 'SUPER_ADMIN'), eventService.createFeaturePaymentIntentHandler);
router.get('/', eventService.listPublicHandler);
router.get('/admin/events', authenticate, requireRoles('SUPER_ADMIN'), eventService.listAdminEventsHandler);
router.get('/admin/events/:id/bookings/export', authenticate, requireRoles('SUPER_ADMIN'), eventService.exportEventBookingsCsvHandler);
router.get('/admin/events/:id/bookings', authenticate, requireRoles('SUPER_ADMIN'), eventService.listEventBookingsForAdminHandler);
router.get('/admin/events/:id', authenticate, requireRoles('SUPER_ADMIN'), eventService.getAdminEventByIdHandler);
router.post('/admin/events/:id/approve', authenticate, requireRoles('SUPER_ADMIN'), eventService.approveEventHandler);
router.delete('/admin/events/:id', authenticate, requireRoles('SUPER_ADMIN'), eventService.softDeleteEventHandler);
router.get('/:eventId/payment-methods', eventService.getPaymentMethodsHandler);
router.get('/:slugOrId', eventService.getBySlugOrIdHandler);
router.post('/', authenticate, requireRoles('ORGANIZER', 'SUPER_ADMIN'), eventService.createEventHandler);
router.patch('/:id', authenticate, requireRoles('ORGANIZER', 'SUPER_ADMIN'), eventService.updateEventHandler);

export default router;
