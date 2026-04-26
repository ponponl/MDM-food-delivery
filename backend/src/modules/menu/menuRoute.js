import express from 'express';
import * as menuController from './menuController.js';
import { uploadCloud } from '../../config/cloudinary.js';

const router = express.Router();

router.get('/restaurant/:publicId', menuController.getRestaurantMenu);
router.get('/item/:itemId', menuController.getMenuItem);
router.post('/add', uploadCloud.single('image'), menuController.addDish);
router.put('/update/:itemId', uploadCloud.single('image'), menuController.updateDish);
router.delete('/delete/:itemId', menuController.deleteDish);

export default router;