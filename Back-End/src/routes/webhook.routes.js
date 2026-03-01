import { Router } from 'express';
import * as stripeService from '../services/stripe.service.js';

const router = Router();

router.post('/stripe', stripeService.webhookHandler);

export default router;
