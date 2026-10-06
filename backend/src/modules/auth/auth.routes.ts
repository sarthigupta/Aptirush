import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateToken } from '../../shared/middleware/auth.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/admin/register', validate(registerSchema), AuthController.adminRegister);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/admin/login', validate(loginSchema), AuthController.adminLogin);
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;
