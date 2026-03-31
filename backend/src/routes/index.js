import express from 'express';
import userRoute from './userRoute.js';
import restaurantRoute from '../modules/restaurant/restaurantRoute.js';
import categoryRoute from '../modules/category/categoryRoute.js';
import cartRoute from '../modules/cart/cartRoute.js';
import orderRoute from '../modules/order/orderRoute.js';
import searchRoute from '../modules/search/searchRoute.js'
import reviewRoute from './reviewRoute.js';
const router = express.Router();

router.use('/users', userRoute); 
router.use('/restaurants', restaurantRoute);
router.use('/categories', categoryRoute);
router.use('/cart', cartRoute);
router.use('/orders', orderRoute);
router.use('/search', searchRoute);
router.use('/reviews', reviewRoute);

export default router;