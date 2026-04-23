import express from 'express';
import { getReviewsByItemId, getReviewsByRestaurantId, createReview, trackItemView } from './reviewController.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authMiddleware.verifyToken, createReview);
router.post('/track-view', authMiddleware.verifyToken, trackItemView);
router.get('/:itemId', getReviewsByItemId);
router.get('/restaurant/:restaurantId', getReviewsByRestaurantId);

export default router;
