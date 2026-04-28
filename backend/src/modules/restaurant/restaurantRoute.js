import express from 'express';
import * as restaurantController from './restaurantController.js';
import { uploadCloud } from '../../config/cloudinary.js';

const router = express.Router();

router.get('/', restaurantController.getRestaurant);

router.get('/summary', restaurantController.getSummary);

router.get('/nearest', restaurantController.getNearest);

router.get('/bulk', restaurantController.getBulkByPublicIds);

router.get('/:publicId', restaurantController.getByPublicId);

router.put(
    '/update', 
    uploadCloud.fields([
        { name: 'image', maxCount: 1 }, 
        { name: 'background', maxCount: 1 }
    ]),
    restaurantController.updateRestaurantInfo);
export default router;