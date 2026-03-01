import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import * as categoryService from '../services/category.service.js';

const router = Router();

router.get('/', categoryService.listCategoriesHandler);
router.post('/', authenticate, requireRoles('SUPER_ADMIN'), categoryService.createCategoryHandler);
router.patch('/:id', authenticate, requireRoles('SUPER_ADMIN'), categoryService.updateCategoryHandler);
router.delete('/:id', authenticate, requireRoles('SUPER_ADMIN'), categoryService.deleteCategoryHandler);

export default router;
