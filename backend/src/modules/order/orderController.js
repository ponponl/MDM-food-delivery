import * as orderService from './orderService.js';
import logger from '../../config/logger.js';

export const createOrder = async (req, res, next) => {
  try {
    const { userExternalId, restaurantId, deliveryAddress, note } = req.body;

    if (!userExternalId || !restaurantId || !deliveryAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: userExternalId, restaurantId, deliveryAddress',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate deliveryAddress structure
    const { receiver, phone, address } = deliveryAddress;
    if (!receiver || !phone || !address) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid delivery address. Required: receiver, phone, address',
        code: 'INVALID_DELIVERY_ADDRESS'
      });
    }

    // Validate phone format (Vietnamese: 10-11 digits, starts with 0)
    const phoneRegex = /^0\d{9,10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE'
      });
    }

    const order = await orderService.createOrder({
      userExternalId,
      restaurantId,
      deliveryAddress,
      note
    });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    logger.error(`Error creating order: ${error.message}`);

    // Handle specific errors
    if (error.message === 'CART_EMPTY') {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty',
        code: 'CART_EMPTY'
      });
    }

    if (error.message.includes('ITEM_UNAVAILABLE')) {
      return res.status(400).json({
        status: 'error',
        message: 'Some items are unavailable',
        code: 'ITEM_UNAVAILABLE'
      });
    }

    next(error);
  }
};

export const getOrderDetail = async (req, res, next) => {
  try {
    const { orderExternalId } = req.params;

    const order = await orderService.getOrderDetail(orderExternalId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.status(200).json({
      status: 'success',
      data: order
    });

  } catch (error) {
    logger.error(`Error getting order detail: ${error.message}`);
    next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const { userExternalId, status, limit = 20, offset = 0 } = req.query;

    if (!userExternalId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: userExternalId',
        code: 'MISSING_PARAMETER'
      });
    }

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const result = await orderService.getUserOrders({
      userExternalId,
      status,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error) {
    logger.error(`Error getting user orders: ${error.message}`);
    next(error);
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    const { orderExternalId } = req.params;
    const { estimatedPrepTime } = req.body;

    const result = await orderService.confirmOrder(orderExternalId, estimatedPrepTime);

    res.status(200).json({
      status: 'success',
      message: 'Order confirmed',
      data: result
    });

  } catch (error) {
    logger.error(`Error confirming order: ${error.message}`);

    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot confirm order with current status',
        code: 'INVALID_STATUS_TRANSITION'
      });
    }

    next(error);
  }
};

export const startDelivery = async (req, res, next) => {
  try {
    const { orderExternalId } = req.params;
    const { driverId, estimatedDeliveryTime } = req.body;

    if (!driverId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: driverId',
        code: 'MISSING_FIELDS'
      });
    }

    const result = await orderService.startDelivery(orderExternalId, {
      driverId,
      estimatedDeliveryTime
    });

    res.status(200).json({
      status: 'success',
      message: 'Delivery started',
      data: result
    });

  } catch (error) {
    logger.error(`Error starting delivery: ${error.message}`);

    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot start delivery with current status',
        code: 'INVALID_STATUS_TRANSITION'
      });
    }

    next(error);
  }
};

export const completeOrder = async (req, res, next) => {
  try {
    const { orderExternalId } = req.params;
    const { completedBy, signature } = req.body;

    const result = await orderService.completeOrder(orderExternalId, {
      completedBy,
      signature
    });

    res.status(200).json({
      status: 'success',
      message: 'Order completed successfully',
      data: result
    });

  } catch (error) {
    logger.error(`Error completing order: ${error.message}`);

    if (error.message === 'INVALID_STATUS_TRANSITION') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot complete order with current status',
        code: 'INVALID_STATUS_TRANSITION'
      });
    }

    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { orderExternalId } = req.params;
    const { reason, cancelledBy } = req.body;

    const result = await orderService.cancelOrder(orderExternalId, {
      reason,
      cancelledBy
    });

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled',
      data: result
    });

  } catch (error) {
    logger.error(`Error cancelling order: ${error.message}`);

    if (error.message === 'INVALID_CANCELLATION') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel order at this stage',
        code: 'INVALID_CANCELLATION'
      });
    }

    next(error);
  }
};
