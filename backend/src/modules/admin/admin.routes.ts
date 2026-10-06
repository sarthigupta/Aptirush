import { Router } from 'express';
import multer from 'multer';
import { AdminController } from '../admin/admin.controller.js';
import { authenticateToken, isAdmin } from '../../shared/middleware/auth.middleware.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post(
  '/documents/upload',
  authenticateToken,
  isAdmin,
  upload.single('file'),
  AdminController.uploadDocument
);

export default router;
