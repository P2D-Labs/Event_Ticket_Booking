import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as bannerService from '../services/banner.service.js';

const router = Router();
router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/', bannerService.listBannersHandler);
router.post('/', bannerService.createBannerHandler);
router.patch('/:id', bannerService.updateBannerHandler);
router.delete('/:id', bannerService.deleteBannerHandler);

export default router;
