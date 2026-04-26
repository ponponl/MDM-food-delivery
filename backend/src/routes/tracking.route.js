import express from 'express';
import { getDriverTracking } from '../modules/tracking/tracking.controller.js';

const router = express.Router();

router.get('/:driver_id', getDriverTracking);

export default router;