import { Router } from 'express';
import { StudentController } from './student.controller.js';
import { authenticateToken } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/modules', authenticateToken, StudentController.getModules);
router.get('/modules/:id', authenticateToken, StudentController.getModuleQuiz);

export default router;
