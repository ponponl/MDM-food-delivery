import pgPool from '../../config/postgres.js';
import redisClient from '../../config/redis.js';
import * as cartService from '../cart/cart.service.js';
import * as menuService from '../../services/menu.service.js';
import logger from '../../config/logger.js';

const ORDER_MIN_VALUE = 20000;
const ORDER_MAX_VALUE = 10000000;
const ACTIVE_ORDER_PREFIX = 'order:active:';

export const createOrder = async ({ userExternalId, restaurantId, deliveryAddress, note }) => {
  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');

    // Get cart from Redis
    const cartItems = await cartService.getCartItems(userExternalId);
    
    if (!cartItems || Object.keys(cartItems).length === 0) {
      throw new Error('CART_EMPTY');
    }

    // Get or create user
    let userResult = await client.query(
      'SELECT id FROM users WHERE externalId = $1',
      [userExternalId]
    );

    let userId;
    if (userResult.rows.length === 0) {
      // Create new user
      const insertUserResult = await client.query(
        `INSERT INTO users (externalId, phone, addresses) 
         VALUES ($1, $2, $3) 
         RETURNING id`,
        [userExternalId, deliveryAddress.phone, JSON.stringify([deliveryAddress])]
      );
      userId = insertUserResult.rows[0].id;
      logger.info(`Created new user: ${userId} for externalId: ${userExternalId}`);
    } else {
      userId = userResult.rows[0].id;
    }

    // Get item prices and calculate total
    const itemIds = Object.keys(cartItems);
    // Mock menu
    const menuItems = await menuService.getMenuItems(itemIds);
    
    let totalPrice = 0;
    const orderItems = [];

    for (const [itemId, quantity] of Object.entries(cartItems)) {
      const menuItem = menuItems[itemId];
      
      // TODO: Check if item is available
      // if (!menuItem || !menuItem.available) {
      //   throw new Error('ITEM_UNAVAILABLE');
      // }

      const qty = parseInt(quantity);
      const price = menuItem?.price || 50000; // Mock price
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
    const orderResult = await client.query(
      `INSERT INTO orders (userId, restaurantId, totalPrice, status, deliveryAddress, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, externalId, created_at`,
      [userId, restaurantId, totalPrice, 'placed', JSON.stringify(deliveryAddress)]
    );

    const order = orderResult.rows[0];
    const orderId = order.id;
    const orderExternalId = order.externalid;

    logger.info(`Created order: ${orderId} (${orderExternalId}) for user: ${userId}`);

    // Create order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (orderId, itemId, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.itemId, item.quantity, item.price]
      );
    }

    logger.info(`Created ${orderItems.length} order items for order: ${orderId}`);

    // Create payment record
    const paymentResult = await client.query(
      `INSERT INTO payments (orderId, method, status)
       VALUES ($1, $2, $3)
       RETURNING id, externalId`,
      [orderId, 'cash', 'pending']
    );

    const payment = paymentResult.rows[0];

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
    const query = `
      SELECT 
        o.id,
        o.externalId,
        o.restaurantId,
        o.totalPrice,
        o.status,
        o.deliveryAddress,
        o.created_at,
        u.externalId as userExternalId,
        u.name as userName,
        u.phone as userPhone,
        p.method as paymentMethod,
        p.status as paymentStatus,
        p.paid_at as paymentPaidAt,
        json_agg(
          json_build_object(
            'itemId', oi.itemId,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      LEFT JOIN payments p ON p.orderId = o.id
      LEFT JOIN order_items oi ON oi.orderId = o.id
      WHERE o.externalId = $1
      GROUP BY o.id, u.externalId, u.name, u.phone, p.method, p.status, p.paid_at
    `;

    const result = await pgPool.query(query, [orderExternalId]);

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];

    // TODO: Get real-time tracking from Redis
    // const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${order.id}`;
    // const tracking = await redisClient.hGetAll(activeOrderKey);

    return {
      orderId: order.id,
      orderExternalId: order.externalid,
      restaurantId: order.restaurantid,
      status: order.status,
      totalPrice: parseFloat(order.totalprice),
      deliveryAddress: order.deliveryaddress,
      items: order.items,
      payment: {
        method: order.paymentmethod,
        status: order.paymentstatus,
        paidAt: order.paymentpaidat
      },
      user: {
        externalId: order.userexternalid,
        name: order.username,
        phone: order.userphone
      },
      createdAt: order.created_at
    };

  } catch (error) {
    logger.error(`Error getting order detail: ${error.message}`);
    throw error;
  }
};

export const getUserOrders = async ({ userExternalId, status, limit, offset }) => {
  try {
    // Get userId from externalId
    const userResult = await pgPool.query(
      'SELECT id FROM users WHERE externalId = $1',
      [userExternalId]
    );

    if (userResult.rows.length === 0) {
      return {
        orders: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      };
    }

    const userId = userResult.rows[0].id;

    // Build query with optional status filter
    let query = `
      SELECT 
        o.id,
        o.externalId,
        o.restaurantId,
        o.status,
        o.totalPrice,
        o.created_at,
        COUNT(*) OVER() as total_count
      FROM orders o
      WHERE o.userId = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pgPool.query(query, params);

    const orders = result.rows.map(row => ({
      orderId: row.id,
      orderExternalId: row.externalid,
      restaurantId: row.restaurantid,
      status: row.status,
      totalPrice: parseFloat(row.totalprice),
      createdAt: row.created_at
    }));

    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    return {
      orders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    };

  } catch (error) {
    logger.error(`Error getting user orders: ${error.message}`);
    throw error;
  }
};

export const confirmOrder = async (orderExternalId, estimatedPrepTime) => {
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // Update order status (with validation)
    const result = await client.query(
      `UPDATE orders 
       SET status = 'confirmed' 
       WHERE externalId = $1 AND status = 'placed'
       RETURNING id, status`,
      [orderExternalId]
    );

    if (result.rows.length === 0) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const orderId = result.rows[0].id;

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

    const result = await client.query(
      `UPDATE orders 
       SET status = 'delivering' 
       WHERE externalId = $1 AND status = 'confirmed'
       RETURNING id, status`,
      [orderExternalId]
    );

    if (result.rows.length === 0) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const orderId = result.rows[0].id;

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

    // Update order status
    const orderResult = await client.query(
      `UPDATE orders 
       SET status = 'completed' 
       WHERE externalId = $1 AND status = 'delivering'
       RETURNING id, status`,
      [orderExternalId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const orderId = orderResult.rows[0].id;

    // Update payment status (COD paid)
    await client.query(
      `UPDATE payments 
       SET status = 'paid', paid_at = NOW()
       WHERE orderId = $1`,
      [orderId]
    );

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
    const orderResult = await client.query(
      `UPDATE orders 
       SET status = 'cancelled' 
       WHERE externalId = $1 AND status IN ('placed', 'confirmed')
       RETURNING id, status`,
      [orderExternalId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('INVALID_CANCELLATION');
    }

    const orderId = orderResult.rows[0].id;

    // Update payment status
    await client.query(
      `UPDATE payments 
       SET status = 'failed'
       WHERE orderId = $1`,
      [orderId]
    );

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
