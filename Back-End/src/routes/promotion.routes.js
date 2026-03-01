import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as promotionService from '../services/promotion.service.js';

const router = Router();
router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/', promotionService.listPromotionsHandler);
router.post('/', promotionService.createPromotionHandler);
router.patch('/:id', promotionService.updatePromotionHandler);
router.delete('/:id', promotionService.deletePromotionHandler);
router.get('/coupons', promotionService.listCouponsHandler);
router.post('/coupons', promotionService.createCouponHandler);
router.delete('/coupons/:id', promotionService.deleteCouponHandler);

export default router;
