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

router.get(
  '/documents',
  authenticateToken,
  isAdmin,
  AdminController.getDocuments
);

router.get(
  '/questions/needs-review',
  authenticateToken,
  isAdmin,
  AdminController.getReviewQuestions
);

router.patch(
  '/questions/:id',
  authenticateToken,
  isAdmin,
  AdminController.publishQuestion
);

router.get(
  '/documents/:jobId/sync',
  authenticateToken,
  isAdmin,
  AdminController.syncDocumentJob
);

export default router;
