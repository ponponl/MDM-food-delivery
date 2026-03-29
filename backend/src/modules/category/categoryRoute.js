import express from 'express';
import * as categoryController from './categoryController.js';

const router = express.Router();

router.get('/', categoryController.getCategories);

export default router;
