import { Router } from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import * as checkoutService from '../services/checkout.service.js';

const router = Router();

router.post('/prepare', optionalAuth, checkoutService.prepareCheckout);
router.get('/bookings/number/:number', optionalAuth, checkoutService.getBookingByNumber);
router.get('/bookings/:id', optionalAuth, checkoutService.getBookingById);
router.get('/my-bookings', authenticate, checkoutService.listMyBookings);
router.get('/koko/callback', checkoutService.kokoCallback);
router.get('/mintpay/callback', checkoutService.mintpayCallback);

export default router;
