import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as organizerService from '../services/organizer.service.js';

const router = Router();
router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/', organizerService.listOrganizersHandler);

export default router;
