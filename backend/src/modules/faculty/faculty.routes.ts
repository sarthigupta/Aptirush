import { Router } from 'express';
import { FacultyController } from './faculty.controller.js';
import { authenticateToken, isFaculty } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/students', authenticateToken, isFaculty, FacultyController.getMyStudents);

export default router;
