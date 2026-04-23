import express from 'express';
import { getRecommendations } from './recommendationController.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

router.get('/', authMiddleware.verifyToken, getRecommendations);

export default router;
