import express from 'express';
import { userController } from '../controllers/userController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh', userController.refresh);

router.post('/logout', authMiddleware.verifyToken, userController.logout);
router.get('/me', authMiddleware.verifyToken, userController.getMe);

router.post('/find-by-username', authMiddleware.verifyToken, userController.getUserByUsername);

export default router;