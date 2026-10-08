import { Router } from 'express';
import { FacultyController } from './faculty.controller.js';
import { authenticateToken, isFaculty } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/students', authenticateToken, isFaculty, FacultyController.getMyStudents);
router.get('/questions', authenticateToken, isFaculty, FacultyController.getAvailableQuestions);
router.post('/tests', authenticateToken, isFaculty, FacultyController.createTest);
router.get('/tests', authenticateToken, isFaculty, FacultyController.getMyTests);

export default router;
