import express from 'express';
import userRoute from './userRoute.js';
import restaurantRoute from './restaurantRoute.js';

const router = express.Router();

router.use('/users', userRoute); 
router.use('/restaurants', restaurantRoute);

export default router;