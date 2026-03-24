import express from 'express';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();

// Add item to cart
router.post('/items', cartController.addItemToCart);

// Get cart
router.get('/', cartController.getCart);

// Update item quantity
router.put('/items', cartController.updateItemQuantity);

// Remove item from cart
router.delete('/items', cartController.removeItemFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

export default router;
