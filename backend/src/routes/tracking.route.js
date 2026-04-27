import express from 'express';
import { getOrderTracking, getLatestOrderLocation } from '../modules/tracking/tracking.controller.js';

const router = express.Router();

router.get('/:order_id', getOrderTracking);
router.get('/:order_id/latest', getLatestOrderLocation);

export default router;