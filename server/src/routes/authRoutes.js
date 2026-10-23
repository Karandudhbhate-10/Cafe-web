import express from 'express';
import { login, getMe, changePassword, publicChangePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.patch('/change-password', requireAuth, changePassword);
router.post('/change-password-public', publicChangePassword);

export default router;
