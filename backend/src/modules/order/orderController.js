import { messageQueue } from '../../config/queue.js';
import * as orderService from './orderService.js';
import logger from '../../config/logger.js';
import { cassandraClient } from '../../config/cassandra.js';
import moment from 'moment';

const resolveUserExternalId = (req) =>
  req.user?.externalId ||
  req.user?.externalid ||
  req.user?.userExternalId ||
  req.body?.userExternalId ||
  req.query?.userExternalId;

export const createOrder = async (req, res, next) => {
  try {
    const { restaurantId, deliveryAddress, note, paymentMethod, itemKeys } = req.body;
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing authentication context',
        code: 'UNAUTHORIZED'
      });
    }

    if (deliveryAddress) {
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
    }

    const order = await orderService.createOrder({
      userExternalId,
      restaurantId,
      deliveryAddress,
      note,
      paymentMethod,
      itemKeys
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

    if (error.message === 'ITEM_KEYS_REQUIRED') {
      return res.status(400).json({
        status: 'error',
        message: 'Selected items are required',
        code: 'ITEM_KEYS_REQUIRED'
      });
    }

    if (error.message === 'CART_ITEM_NOT_FOUND') {
      return res.status(400).json({
        status: 'error',
        message: 'Some selected items are not found in cart',
        code: 'CART_ITEM_NOT_FOUND'
      });
    }

    if (error.message === 'MULTIPLE_RESTAURANTS') {
      return res.status(400).json({
        status: 'error',
        message: 'Please select items from a single restaurant',
        code: 'MULTIPLE_RESTAURANTS'
      });
    }

    if (error.message === 'MISSING_DELIVERY_ADDRESS') {
      return res.status(400).json({
        status: 'error',
        message: 'Delivery address is required',
        code: 'MISSING_DELIVERY_ADDRESS'
      });
    }

    if (error.message.includes('ITEM_UNAVAILABLE')) {
      return res.status(400).json({
        status: 'error',
        message: 'Some items are unavailable',
        code: 'ITEM_UNAVAILABLE'
      });
    }

    if (error.message === 'ITEM_OUT_OF_STOCK') {
      return res.status(400).json({
        status: 'error',
        message: 'Some items are out of stock',
        code: 'ITEM_OUT_OF_STOCK'
      });
    }

    if (error.message === 'CART_RESTAURANT_MISMATCH' || error.message === 'ITEM_RESTAURANT_MISMATCH') {
      return res.status(400).json({
        status: 'error',
        message: 'Items must belong to the selected restaurant',
        code: 'CART_RESTAURANT_MISMATCH'
      });
    }

    next(error);
  }
};

export const previewOrder = async (req, res, next) => {
  try {
    const { restaurantId, itemKeys } = req.body;
    const userExternalId = resolveUserExternalId(req);

    if (!userExternalId) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing authentication context',
        code: 'UNAUTHORIZED'
      });
    }

    const preview = await orderService.previewOrder({
      userExternalId,
      restaurantId,
      itemKeys
    });

    res.status(200).json({
      status: 'success',
      data: preview
    });

  } catch (error) {
    logger.error(`Error previewing order: ${error.message}`);

    if (error.message === 'CART_EMPTY') {
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty',
        code: 'CART_EMPTY'
      });
    }

    if (error.message === 'ITEM_KEYS_REQUIRED') {
      return res.status(400).json({
        status: 'error',
        message: 'Selected items are required',
        code: 'ITEM_KEYS_REQUIRED'
      });
    }

    if (error.message === 'CART_ITEM_NOT_FOUND') {
      return res.status(400).json({
        status: 'error',
        message: 'Some selected items are not found in cart',
        code: 'CART_ITEM_NOT_FOUND'
      });
    }

    if (error.message === 'MULTIPLE_RESTAURANTS') {
      return res.status(400).json({
        status: 'error',
        message: 'Please select items from a single restaurant',
        code: 'MULTIPLE_RESTAURANTS'
      });
    }

    if (error.message === 'MISSING_RESTAURANT') {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant is required',
        code: 'MISSING_RESTAURANT'
      });
    }

    if (error.message.includes('ITEM_UNAVAILABLE')) {
      return res.status(400).json({
        status: 'error',
        message: 'Some items are unavailable',
        code: 'ITEM_UNAVAILABLE'
      });
    }

    if (error.message === 'ITEM_OUT_OF_STOCK') {
      return res.status(400).json({
        status: 'error',
        message: 'Some items are out of stock',
        code: 'ITEM_OUT_OF_STOCK'
      });
    }

    if (error.message === 'CART_RESTAURANT_MISMATCH' || error.message === 'ITEM_RESTAURANT_MISMATCH') {
      return res.status(400).json({
        status: 'error',
        message: 'Items must belong to the selected restaurant',
        code: 'CART_RESTAURANT_MISMATCH'
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

export const getRestaurantOrders = async (req, res, next) => {
  try {
    const { restaurantId, status, limit = 20, offset = 0 } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: restaurantId',
        code: 'MISSING_PARAMETER'
      });
    }

    const parsedLimit = Math.min(parseInt(limit) || 20, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    const result = await orderService.getRestaurantOrders({
      restaurantId,
      status,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.status(200).json({
      status: 'success',
      data: result
    });

  } catch (error) {
    logger.error(`Error getting restaurant orders: ${error.message}`);
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

    const result = await orderService.startDelivery(orderExternalId, {
      driverId: driverId || 'merchant',
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
    
    const fullOrder = await orderService.getOrderDetail(orderExternalId);

    messageQueue.emit('ORDER_FINISHED', {
       orderId: orderExternalId,
       restaurantId: fullOrder.restaurantId, 
       totalPrice: fullOrder.totalPrice,     
       timestamp: new Date().toISOString()
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

export const getRevenueStats = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const granularity = (req.query.granularity || 'DAY').toUpperCase();
    const exactDate = req.query.exactDate; // New: YYYY-MM-DD format
    
    let rawTimePartition = req.query.timePartition; 
    let dbPartitionKey = '';
    let query = '';
    let params = [];

    if (!restaurantId) {
      return res.status(400).json({ status: 'error', message: 'Thiếu restaurantId rồi m ơi!' });
    }

    if (exactDate && granularity === 'DAY') {
      dbPartitionKey = exactDate.substring(0, 7);
      
      query = `
        SELECT * FROM foodly_tracking.restaurant_revenue_stats 
        WHERE restaurant_id = ? AND granularity = ? AND time_partition = ? AND time_value = ?
      `;
      params = [restaurantId, granularity, dbPartitionKey, exactDate];
    } 
    else {
      if (granularity === 'DAY') {
        if (rawTimePartition && rawTimePartition.length >= 7) {
          dbPartitionKey = rawTimePartition.substring(0, 7);
        } else {
          dbPartitionKey = moment().format('YYYY-MM');
        }
      } 
      else if (granularity === 'MONTH') {
        if (rawTimePartition && rawTimePartition.length >= 4) {
          dbPartitionKey = rawTimePartition.substring(0, 4);
        } else {
          dbPartitionKey = moment().format('YYYY');
        }
      } 
      else if (granularity === 'YEAR') {
        dbPartitionKey = 'ALL';
      }

      query = `
        SELECT * FROM foodly_tracking.restaurant_revenue_stats 
        WHERE restaurant_id = ? AND granularity = ? AND time_partition = ?
      `;
      params = [restaurantId, granularity, dbPartitionKey];
    }

    const result = await cassandraClient.execute(query, params, { prepare: true });
    const sortedData = result.rows.sort((a, b) => a.time_value.localeCompare(b.time_value));

    res.status(200).json({
      status: 'success',
      data: sortedData
    });

  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    next(error);
  }
};