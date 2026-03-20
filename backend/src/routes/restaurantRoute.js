import express from 'express';
import { getRestaurant } from '../controllers/restaurantController.js';

const router = express.Router();

router.get('/', getRestaurant);

export default router;