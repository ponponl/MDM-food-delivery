import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

router.post('/merchant/register', authController.registerMerchant);
router.post('/merchant/login', authController.loginMerchant);

export default router;
