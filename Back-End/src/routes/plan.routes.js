import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as planService from '../services/plan.service.js';

const router = Router();
router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/', planService.listPlansHandler);
router.post('/', planService.createPlanHandler);
router.patch('/:id', planService.updatePlanHandler);

export default router;
