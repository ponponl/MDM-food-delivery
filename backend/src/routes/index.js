import express from 'express';
import userRoute from './userRoute.js';

const router = express.Router();

// Nếu ở đây bạn viết là '/users'
router.use('/users', userRoute); 

export default router;