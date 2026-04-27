import express from 'express';
import { getOrderTracking } from '../modules/tracking/tracking.controller.js';

const router = express.Router();

router.get('/:order_id', getOrderTracking);

export default router;