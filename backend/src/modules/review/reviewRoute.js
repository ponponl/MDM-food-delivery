import express from 'express';
import { getReviewsByItemId, getReviewsByRestaurantId, createReview } from './reviewController.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authMiddleware.verifyToken, createReview);
router.get('/:itemId', getReviewsByItemId);
router.get('/restaurant/:restaurantId', getReviewsByRestaurantId);

export default router;
