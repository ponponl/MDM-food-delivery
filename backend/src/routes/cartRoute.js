import express from 'express';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();

// Add item to cart
router.post('/items', cartController.addItemToCart);

// Get cart
router.get('/', cartController.getCart);

// Get cart by restaurant
router.get('/restaurants/:restaurantPublicId', cartController.getCartByRestaurant);

// Update item quantity
router.put('/items', cartController.updateItemQuantity);

// Remove item from cart
router.delete('/items', cartController.removeItemFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

export default router;
