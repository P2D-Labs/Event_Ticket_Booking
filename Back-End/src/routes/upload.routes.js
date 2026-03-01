import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as uploadService from '../services/upload.service.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRoles('ORGANIZER', 'SUPER_ADMIN'),
  upload.single('image'),
  uploadService.uploadHandler,
  uploadService.uploadErrorHandler
);

export default router;
