import express from 'express';
import * as restaurantController from './restaurantController.js';
import { uploadCloud } from '../../config/cloudinary.js';

const router = express.Router();

router.get('/', restaurantController.getRestaurant);

router.get('/summary', restaurantController.getSummary);

router.get('/nearest', restaurantController.getNearest);

router.get('/bulk', restaurantController.getBulkByPublicIds);

router.get('/:publicId', restaurantController.getByPublicId);

router.put('/update', uploadCloud.single('image'), restaurantController.updateRestaurantInfo);

export default router;