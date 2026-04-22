import express from 'express';
import { authController } from '../controllers/authController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/merchant/register', authController.registerMerchant);
router.post('/merchant/login', authController.loginMerchant);
router.get('/merchant/me', authMiddleware.verifyToken, authController.getMerchantMe);

export default router;
