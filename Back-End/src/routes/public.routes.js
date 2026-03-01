import { Router } from 'express';
import * as publicService from '../services/public.service.js';

const router = Router();

router.get('/banners', publicService.getBannersHandler);
router.get('/testimonials', publicService.getTestimonialsHandler);
router.get('/categories', publicService.getCategoriesHandler);
router.get('/featured-events', publicService.getFeaturedEventsHandler);
router.get('/coming-soon-events', publicService.getComingSoonEventsHandler);
router.get('/payment-methods', publicService.getPaymentMethodsHandler);

export default router;
