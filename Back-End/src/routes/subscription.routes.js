import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as subscriptionService from '../services/subscription.service.js';

const router = Router();

router.get('/plans', subscriptionService.listPlansHandler);
router.post('/checkout-session', authenticate, subscriptionService.createCheckoutSessionHandler);
router.get('/me', authenticate, subscriptionService.getMySubscriptionHandler);
router.post('/cancel', authenticate, subscriptionService.cancelSubscriptionHandler);

export default router;
