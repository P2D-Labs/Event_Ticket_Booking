import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as testimonialService from '../services/testimonial.service.js';

const router = Router();

// Any authenticated user can submit a testimonial (pending admin approval)
router.post('/submit', authenticate, testimonialService.submitTestimonialHandler);

router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));
router.get('/', testimonialService.listTestimonialsHandler);
router.post('/', testimonialService.createTestimonialHandler);
router.patch('/:id', testimonialService.updateTestimonialHandler);
router.delete('/:id', testimonialService.deleteTestimonialHandler);

export default router;
