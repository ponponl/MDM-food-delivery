import pgPool from '../config/postgres.js';
import redisClient from '../config/redis.js';
import * as cartService from './cartService.js';
import * as menuService from './menu.service.js';
import logger from '../config/logger.js';
import { OrderRepository } from '../repositories/orderRepo.js';

const ORDER_MIN_VALUE = 20000;
const ORDER_MAX_VALUE = 10000000;
const ACTIVE_ORDER_PREFIX = 'order:active:';

const orderRepository = new OrderRepository();

export const createOrder = async ({ userExternalId, restaurantId, deliveryAddress, note }) => {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // Get cart from Redis
    const cartItems = await cartService.getCartItems(userExternalId, restaurantId);

    if (!cartItems || cartItems.length === 0) {
      throw new Error('CART_EMPTY');
    }

    // Get or create user
    let userId = await orderRepository.findUserIdByExternalId(client, userExternalId);

    if (!userId) {
      userId = await orderRepository.createUser(client, {
        userExternalId,
        phone: deliveryAddress.phone,
        deliveryAddress
      });
      logger.info(`Created new user: ${userId} for externalId: ${userExternalId}`);
    }

    // Get item prices and calculate total
    const itemIds = [...new Set(cartItems.map((item) => item._id || item.itemId))];
    const menuItems = await menuService.getMenuItems(itemIds);

    let totalPrice = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const itemId = cartItem._id || cartItem.itemId;
      const menuItem = menuItems[itemId];

      // TODO: Check if item is available
    //   if (!menuItem || !menuItem.available) {
    //     throw new Error('ITEM_UNAVAILABLE');
    //   }

      const qty = parseInt(cartItem.quantity);
      const price = menuItem?.price ?? cartItem.price ?? 0;
      const subtotal = price * qty;

      totalPrice += subtotal;
      orderItems.push({
        itemId,
        quantity: qty,
        price
      });
    }

    // Validate order value
    if (totalPrice < ORDER_MIN_VALUE) {
      throw new Error(`Order value must be at least ${ORDER_MIN_VALUE} VND`);
    }

    if (totalPrice > ORDER_MAX_VALUE) {
      throw new Error(`Order value cannot exceed ${ORDER_MAX_VALUE} VND`);
    }

    // Create order
    const order = await orderRepository.createOrder(client, {
      userId,
      restaurantId,
      totalPrice,
      status: 'placed',
      deliveryAddress
    });

    const orderId = order.id;
    const orderExternalId = order.externalid;

    logger.info(`Created order: ${orderId} (${orderExternalId}) for user: ${userId}`);

    // Create order items
    await orderRepository.createOrderItems(client, orderId, orderItems);

    logger.info(`Created ${orderItems.length} order items for order: ${orderId}`);

    // Create payment record
    const payment = await orderRepository.createPayment(client, {
      orderId,
      method: 'cash',
      status: 'pending'
    });

    logger.info(`Created payment: ${payment.id} for order: ${orderId}`);

    await client.query('COMMIT');

    // Clear cart from Redis
    await cartService.clearCart(userExternalId);

    // Create active order tracking in Redis
    const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${orderId}`;
    await redisClient.hSet(activeOrderKey, 'status', 'placed');
    await redisClient.hSet(activeOrderKey, 'created_at', new Date().toISOString());
    await redisClient.expire(activeOrderKey, 86400); // 24 hours

    // Step 9: TODO - Emit real-time event
    // emitOrderEvent('order:created', { orderId, orderExternalId, status: 'placed' });

    return {
      orderId,
      orderExternalId,
      status: 'placed',
      totalPrice,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      estimatedDelivery: '30-45 minutes',
      createdAt: order.created_at
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error in createOrder transaction: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

export const getOrderDetail = async (orderExternalId) => {
  try {
    return await orderRepository.getOrderDetailByExternalId(orderExternalId);
  } catch (error) {
    logger.error(`Error getting order detail: ${error.message}`);
    throw error;
  }
};

export const getUserOrders = async ({ userExternalId, status, limit, offset }) => {
  try {
    return await orderRepository.getUserOrdersByExternalId({
      userExternalId,
      status,
      limit,
      offset
    });
  } catch (error) {
    logger.error(`Error getting user orders: ${error.message}`);
    throw error;
  }
};

export const confirmOrder = async (orderExternalId, estimatedPrepTime) => {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    const updated = await orderRepository.updateOrderStatus(client, {
      orderExternalId,
      fromStatuses: 'placed',
      toStatus: 'confirmed'
    });

    if (!updated) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const orderId = updated.id;

    await client.query('COMMIT');

    // Update Redis tracking
    const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${orderId}`;
    await redisClient.hSet(activeOrderKey, 'status', 'confirmed');
    if (estimatedPrepTime) {
      await redisClient.hSet(activeOrderKey, 'estimatedPrepTime', estimatedPrepTime.toString());
    }
    await redisClient.hSet(activeOrderKey, 'confirmedAt', new Date().toISOString());

    // TODO: Emit real-time event
    // emitOrderEvent('order:confirmed', { orderId, orderExternalId, status: 'confirmed' });

    logger.info(`Order ${orderId} confirmed`);

    return {
      orderId,
      status: 'confirmed',
      estimatedPrepTime
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error confirming order: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

export const startDelivery = async (orderExternalId, { driverId, estimatedDeliveryTime }) => {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    const updated = await orderRepository.updateOrderStatus(client, {
      orderExternalId,
      fromStatuses: 'confirmed',
      toStatus: 'delivering'
    });

    if (!updated) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const orderId = updated.id;

    await client.query('COMMIT');

    // Update Redis tracking
    const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${orderId}`;
    await redisClient.hSet(activeOrderKey, 'status', 'delivering');
    await redisClient.hSet(activeOrderKey, 'driverId', driverId);
    if (estimatedDeliveryTime) {
      await redisClient.hSet(activeOrderKey, 'estimatedTime', estimatedDeliveryTime.toString());
    }
    await redisClient.hSet(activeOrderKey, 'deliveryStartedAt', new Date().toISOString());

    // TODO: Emit real-time event
    // emitOrderEvent('order:delivering', { orderId, orderExternalId, driverId });

    logger.info(`Order ${orderId} delivery started by driver ${driverId}`);

    return {
      orderId,
      status: 'delivering',
      driverId,
      estimatedDeliveryTime
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error starting delivery: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

export const completeOrder = async (orderExternalId, { completedBy, signature }) => {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    const updated = await orderRepository.updateOrderStatus(client, {
      orderExternalId,
      fromStatuses: 'delivering',
      toStatus: 'completed'
    });

    if (!updated) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const orderId = updated.id;

    // Update payment status (COD paid)
    await orderRepository.updatePaymentStatus(client, {
      orderId,
      status: 'paid',
      paidAt: new Date()
    });

    await client.query('COMMIT');

    // Update Redis tracking (with expiration)
    const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${orderId}`;
    await redisClient.hSet(activeOrderKey, 'status', 'completed');
    await redisClient.hSet(activeOrderKey, 'completedAt', new Date().toISOString());
    await redisClient.expire(activeOrderKey, 3600); // Keep for 1 hour

    // TODO: Emit real-time event
    // emitOrderEvent('order:completed', { orderId, orderExternalId });

    logger.info(`Order ${orderId} completed`);

    return {
      orderId,
      status: 'completed',
      payment: {
        status: 'paid',
        paidAt: new Date()
      }
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error completing order: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

export const cancelOrder = async (orderExternalId, { reason, cancelledBy }) => {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // Can only cancel if status is 'placed' or 'confirmed'
    const updated = await orderRepository.updateOrderStatus(client, {
      orderExternalId,
      fromStatuses: ['placed', 'confirmed'],
      toStatus: 'cancelled'
    });

    if (!updated) {
      throw new Error('INVALID_CANCELLATION');
    }

    const orderId = updated.id;

    // Update payment status
    await orderRepository.updatePaymentStatus(client, {
      orderId,
      status: 'failed'
    });

    await client.query('COMMIT');

    // Update Redis tracking
    const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${orderId}`;
    await redisClient.hSet(activeOrderKey, 'status', 'cancelled');
    await redisClient.hSet(activeOrderKey, 'cancelledAt', new Date().toISOString());
    if (reason) {
      await redisClient.hSet(activeOrderKey, 'cancelReason', reason);
    }
    await redisClient.expire(activeOrderKey, 3600);

    // TODO: Emit real-time event
    // emitOrderEvent('order:cancelled', { orderId, orderExternalId, reason });

    logger.info(`Order ${orderId} cancelled. Reason: ${reason}`);

    return {
      orderId,
      status: 'cancelled',
      reason
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error cancelling order: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};
