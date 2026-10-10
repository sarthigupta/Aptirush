import { Router } from 'express';
import { StudentController } from './student.controller.js';
import { authenticateToken } from '../../shared/middleware/auth.middleware.js';

const router = Router();

router.get('/modules', authenticateToken, StudentController.getModules);
router.get('/modules/:id', authenticateToken, StudentController.getModuleQuiz);
router.post('/attempts', authenticateToken, StudentController.saveTestAttempt);
router.get('/dashboard-stats', authenticateToken, StudentController.getDashboardStats);
router.get('/custom-tests', authenticateToken, StudentController.getAssignedTests);
router.get('/leaderboard', authenticateToken, StudentController.getLeaderboard);

export default router;
