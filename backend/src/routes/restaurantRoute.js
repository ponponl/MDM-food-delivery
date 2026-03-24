import express from 'express';
import * as restaurantController from '../controllers/restaurantController.js';

const router = express.Router();

router.get('/', restaurantController.getRestaurant);

router.get('/summary', restaurantController.getSummary);

router.get('/:id', restaurantController.getById);

export default router;