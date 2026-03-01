import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as settingsService from '../services/settings.service.js';

const router = Router();
router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/', settingsService.getSettingsHandler);
router.patch('/', settingsService.updateSettingsHandler);

export default router;
