import { Router } from 'express';
import { register, login, me, forgotPassword, resetPassword, registerPushToken } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/push-token', requireAuth, registerPushToken);

export default router;
