import express from 'express';
import userRoute from './userRoute.js';
import restaurantRoute from './restaurantRoute.js';
import categoryRoute from './categoryRoute.js';
import cartRoute from './cartRoute.js';
import orderRoute from './orderRoute.js';

const router = express.Router();

router.use('/users', userRoute); 
router.use('/restaurants', restaurantRoute);
router.use('/categories', categoryRoute);
router.use('/cart', cartRoute);
router.use('/orders', orderRoute);

export default router;