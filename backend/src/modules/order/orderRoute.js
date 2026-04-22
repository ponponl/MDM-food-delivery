import express from 'express';
import * as orderController from './orderController.js';

const router = express.Router();

// Create order (checkout)
router.post('/', orderController.createOrder);

// Preview order pricing
router.post('/preview', orderController.previewOrder);

// Get restaurant orders (list)
router.get('/restaurant', orderController.getRestaurantOrders);

// Get order by external ID
router.get('/:orderExternalId', orderController.getOrderDetail);

// Get user orders (list)
router.get('/', orderController.getUserOrders);

// Update order status - Confirm
router.patch('/:orderExternalId/confirm', orderController.confirmOrder);

// Update order status - Start delivery
router.patch('/:orderExternalId/deliver', orderController.startDelivery);

// Update order status - Complete
router.patch('/:orderExternalId/complete', orderController.completeOrder);

// Update order status - Cancel
router.patch('/:orderExternalId/cancel', orderController.cancelOrder);

// Revenue report
router.get('/stats/revenue', orderController.getRevenueStats);

export default router;
