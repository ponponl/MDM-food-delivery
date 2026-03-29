import express from 'express';
import { getReviewsByItemId, getReviewsByRestaurantId } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/:itemId', getReviewsByItemId);
router.get('/restaurant/:restaurantId', getReviewsByRestaurantId);

export default router;
