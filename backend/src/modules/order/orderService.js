import pgPool from '../../config/postgres.js';
import redisClient from '../../config/redis.js';
import logger from '../../config/logger.js';
import * as cartService from '../cart/cartService.js';
import * as menuService from '../menu/menuService.js';
import { menuCache } from '../menu/menuCache.js';
import { OrderRepository } from './orderRepo.js';
import { RestaurantRepository } from '../restaurant/restaurantRepo.js'; 
import { ShipperRepository } from '../tracking/shipperRepo.js';


const ORDER_MIN_VALUE = 20000;
const ORDER_MAX_VALUE = 10000000;
const ACTIVE_ORDER_PREFIX = 'order:active:';

const orderRepository = new OrderRepository();
const restaurantRepository = new RestaurantRepository();
const shipperRepository = new ShipperRepository();

const resolveDeliveryAddress = (userRecord, deliveryAddress) => {
  if (deliveryAddress) {
    return deliveryAddress;
  }

  const addresses = Array.isArray(userRecord?.addresses) ? userRecord.addresses : [];
  if (addresses.length > 0) {
    return addresses[0];
  }

  return null;
};

export const createOrder = async ({
  userExternalId,
  restaurantId,
  deliveryAddress,
  note,
  paymentMethod = 'cash',
  itemKeys = null
}) => {
  const client = await pgPool.connect();
  const deductedRedisItems = [];

  try {
    await client.query('BEGIN');

    if (!userExternalId) {
      throw new Error('MISSING_USER');
    }

    let targetRestaurantId = restaurantId;

    if (!targetRestaurantId) {
      const cartSummary = await cartService.getCart(userExternalId);
      const restaurants = cartSummary?.restaurants || [];
      if (!restaurants.length) {
        throw new Error('CART_EMPTY');
      }
      if (restaurants.length > 1) {
        throw new Error('MULTIPLE_RESTAURANTS');
      }
      targetRestaurantId = restaurants[0]?.restaurantId || restaurants[0]?.id || null;
    }

    if (!targetRestaurantId) {
      throw new Error('MISSING_RESTAURANT');
    }

    // Get cart from Redis (snapshot)
    const useItemKeys = Array.isArray(itemKeys) && itemKeys.length > 0;
    if (Array.isArray(itemKeys) && itemKeys.length === 0) {
      throw new Error('ITEM_KEYS_REQUIRED');
    }

    const cartItems = useItemKeys
      ? await cartService.getCartItemsByKeys(userExternalId, targetRestaurantId, itemKeys)
      : await cartService.getCartItems(userExternalId, targetRestaurantId);

    if (!cartItems || cartItems.length === 0) {
      throw new Error('CART_EMPTY');
    }

    if (useItemKeys && cartItems.length !== itemKeys.length) {
      throw new Error('CART_ITEM_NOT_FOUND');
    }

    const cartRestaurantIds = new Set(
      cartItems
        .map((item) => item?.restaurantId)
        .filter(Boolean)
    );

    if (cartRestaurantIds.size > 1 || (cartRestaurantIds.size === 1 && !cartRestaurantIds.has(targetRestaurantId))) {
      throw new Error('CART_RESTAURANT_MISMATCH');
    }

    // Get or create user
    const userRecord = await orderRepository.findUserByExternalId(client, userExternalId);
    let userId = userRecord?.id ?? null;
    const resolvedDeliveryAddress = resolveDeliveryAddress(userRecord, deliveryAddress);

    if (!resolvedDeliveryAddress) {
      throw new Error('MISSING_DELIVERY_ADDRESS');
    }

    if (!userId) {
      userId = await orderRepository.createUser(client, {
        userExternalId,
        phone: resolvedDeliveryAddress.phone,
        deliveryAddress: resolvedDeliveryAddress
      });
      logger.info(`Created new user: ${userId} for externalId: ${userExternalId}`);
    }

    const restaurantSnapshotName = cartItems.find((item) => item?.restaurantName)?.restaurantName || null;
    const restaurantSnapshotImage = cartItems.find((item) => item?.restaurantImage)?.restaurantImage || null;

    // Get item prices and calculate total
    const itemIds = [...new Set(cartItems.map((item) => item._id || item.itemId))];
    const menuItems = await menuService.getMenuItems(itemIds);

    let totalPrice = 0;
    let totalItems = 0;
    const orderItems = [];
    const priceUpdates = [];
    const cartPriceUpdates = [];

    for (const cartItem of cartItems) {
      const itemId = cartItem._id || cartItem.itemId;
      const menuItem = menuItems[itemId];
      const qty = parseInt(cartItem.quantity);
      console.log(qty);

      if (!menuItem || !menuItem.available) {
        throw new Error('ITEM_UNAVAILABLE');
      }

      // const qty = parseInt(cartItem.quantity);
      // if (!Number.isFinite(qty) || qty <= 0) {
      //   throw new Error('INVALID_QUANTITY');
      // }

      // if (typeof menuItem?.stock === 'number' && menuItem.stock < qty) {
      //   throw new Error('ITEM_OUT_OF_STOCK');
      // }

      const result = await menuCache.deductStock(itemId, qty);
      
      if (!result.success) {
        throw new Error(`ITEM_OUT_OF_STOCK: ${cartItem.name} chỉ còn ${result.remaining} món`);
      }

      deductedRedisItems.push({ itemId, qty });

      const currentPrice = typeof menuItem?.price === 'number' ? menuItem.price : 0;
      const snapshotPrice = typeof cartItem.priceSnapshot === 'number'
        ? cartItem.priceSnapshot
        : (typeof cartItem.price === 'number' ? cartItem.price : currentPrice);

      if (snapshotPrice !== currentPrice) {
        priceUpdates.push({
          itemId,
          snapshotPrice,
          currentPrice
        });

        cartPriceUpdates.push({
          ...cartItem,
          priceCurrent: currentPrice,
          priceUpdated: true
        });
      }

      const orderSnapshotPrice = Number.isFinite(currentPrice) ? currentPrice : snapshotPrice;
      const subtotal = orderSnapshotPrice * qty;

      totalPrice += subtotal;
      totalItems += qty;
      orderItems.push({
        itemId,
        itemName: cartItem.name || menuItem?.name || `Item ${itemId}`,
        itemImageUrl: cartItem.image || menuItem?.image || menuItem?.images?.[0] || null,
        quantity: qty,
        snapshotPrice: orderSnapshotPrice,
        options: Array.isArray(cartItem.options) ? cartItem.options : []
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
      restaurantId: targetRestaurantId,
      restaurantName: restaurantSnapshotName,
      restaurantImageUrl: restaurantSnapshotImage,
      totalPrice,
      totalItems,
      status: 'placed',
      deliveryAddress: resolvedDeliveryAddress
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
      method: paymentMethod,
      status: 'pending'
    });

    logger.info(`Created payment: ${payment.id} for order: ${orderId}`);

    await client.query('COMMIT');

    if (cartPriceUpdates.length > 0) {
      await cartService.updateCartPriceFlags(userExternalId, targetRestaurantId, cartPriceUpdates);
    }

    // Clear cart from Redis
    if (useItemKeys) {
      await cartService.removeItemsByKey(userExternalId, targetRestaurantId, itemKeys);
    } else {
      await cartService.clearCartByRestaurant(userExternalId, targetRestaurantId);
    }

    // Create active order tracking in Redis
    const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${orderId}`;
    await redisClient.hSet(activeOrderKey, 'status', 'placed');
    await redisClient.hSet(activeOrderKey, 'created_at', new Date().toISOString());
    await redisClient.expire(activeOrderKey, 86400); // 24 hours

    // Step 9: TODO - Emit real-time event
    // emitOrderEvent('order:created', { orderId, orderExternalId, status: 'placed' });

    return {
      orderExternalId,
      status: 'placed',
      totalPrice,
      totalItems,
      items: orderItems,
      restaurantId: targetRestaurantId,
      restaurantName: restaurantSnapshotName,
      restaurantImageUrl: restaurantSnapshotImage,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      estimatedDelivery: '30-45 minutes',
      createdAt: order.created_at,
      priceUpdates
    };

  } catch (error) {
    try {
      if (client) await client.query('ROLLBACK');
    } catch (pgError) {
      logger.error('Postgres Rollback failed:', pgError.message);
    }
    if (deductedRedisItems.length > 0) {
      try {
        const rollbackPromises = deductedRedisItems.map(item => 
          menuCache.rollbackStock(item.itemId, item.qty)
        );
        await Promise.all(rollbackPromises);
        logger.info(`Rolled back ${deductedRedisItems.length} items to Redis`);
      } catch (redisError) {
        logger.error('Redis Rollback failed (Data Inconsistency!):', redisError.message);
      }
    }

    logger.error(`Error in createOrder: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

export const previewOrder = async ({
  userExternalId,
  restaurantId,
  itemKeys = null
}) => {
  if (!userExternalId) {
    throw new Error('MISSING_USER');
  }

  let targetRestaurantId = restaurantId;

  if (!targetRestaurantId) {
    const cartSummary = await cartService.getCart(userExternalId);
    const restaurants = cartSummary?.restaurants || [];
    if (!restaurants.length) {
      throw new Error('CART_EMPTY');
    }
    if (restaurants.length > 1) {
      throw new Error('MULTIPLE_RESTAURANTS');
    }
    targetRestaurantId = restaurants[0]?.restaurantId || restaurants[0]?.id || null;
  }

  if (!targetRestaurantId) {
    throw new Error('MISSING_RESTAURANT');
  }

  const useItemKeys = Array.isArray(itemKeys) && itemKeys.length > 0;
  if (Array.isArray(itemKeys) && itemKeys.length === 0) {
    throw new Error('ITEM_KEYS_REQUIRED');
  }

  const cartItems = useItemKeys
    ? await cartService.getCartItemsByKeys(userExternalId, targetRestaurantId, itemKeys)
    : await cartService.getCartItems(userExternalId, targetRestaurantId);

  if (!cartItems || cartItems.length === 0) {
    throw new Error('CART_EMPTY');
  }

  if (useItemKeys && cartItems.length !== itemKeys.length) {
    throw new Error('CART_ITEM_NOT_FOUND');
  }

  const cartRestaurantIds = new Set(
    cartItems
      .map((item) => item?.restaurantId)
      .filter(Boolean)
  );

  if (cartRestaurantIds.size > 1 || (cartRestaurantIds.size === 1 && !cartRestaurantIds.has(targetRestaurantId))) {
    throw new Error('CART_RESTAURANT_MISMATCH');
  }

  const itemIds = [...new Set(cartItems.map((item) => item._id || item.itemId))];
  const menuItems = await menuService.getMenuItems(itemIds);

  let totalPrice = 0;
  const previewItems = [];
  const priceUpdates = [];
  const cartPriceUpdates = [];

  for (const cartItem of cartItems) {
    const itemId = cartItem._id || cartItem.itemId;
    const menuItem = menuItems[itemId];

    if (!menuItem || !menuItem.available) {
      throw new Error('ITEM_UNAVAILABLE');
    }

    const qty = parseInt(cartItem.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('INVALID_QUANTITY');
    }

    if (typeof menuItem?.stock === 'number' && menuItem.stock < qty) {
      throw new Error('ITEM_OUT_OF_STOCK');
    }

    const currentPrice = typeof menuItem?.price === 'number' ? menuItem.price : 0;
    const snapshotPrice = typeof cartItem.priceSnapshot === 'number'
      ? cartItem.priceSnapshot
      : (typeof cartItem.price === 'number' ? cartItem.price : currentPrice);
    const priceUpdated = snapshotPrice !== currentPrice;

    if (priceUpdated) {
      priceUpdates.push({
        itemId,
        snapshotPrice,
        currentPrice
      });
    }

    const subtotal = currentPrice * qty;
    totalPrice += subtotal;

    previewItems.push({
      ...cartItem,
      priceSnapshot: snapshotPrice,
      priceCurrent: currentPrice,
      priceUpdated,
      subtotal
    });

    cartPriceUpdates.push({
      ...cartItem,
      priceCurrent: currentPrice,
      priceUpdated
    });
  }

  if (cartPriceUpdates.length > 0) {
    await cartService.updateCartPriceFlags(userExternalId, targetRestaurantId, cartPriceUpdates);
  }

  return {
    restaurantId: targetRestaurantId,
    totalPrice,
    items: previewItems,
    priceUpdates
  };
};

export const getOrderDetail = async (orderExternalId) => {
  try {
    const order = await orderRepository.getOrderDetailByExternalId(orderExternalId);

    if (!order) return null;

    if (order.restaurantId) {
      try {
        const restaurant = await restaurantRepository.findByPublicId(order.restaurantId, { includeMenu: false });
        
        if (restaurant && restaurant.address?.location?.coordinates) {
          order.restaurantLng = restaurant.address.location.coordinates[0];
          order.restaurantLat = restaurant.address.location.coordinates[1];
        }
      } catch (mongoErr) {
        logger.error(`[Mongo] Lỗi khi lấy tọa độ quán ${order.restaurantId}: ${mongoErr.message}`);
      }
    }
    
    return order;
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

export const getRestaurantOrders = async ({ restaurantId, status, limit, offset }) => {
  try {
    return await orderRepository.getRestaurantOrdersByRestaurantId({
      restaurantId,
      status,
      limit,
      offset
    });
  } catch (error) {
    logger.error(`Error getting restaurant orders: ${error.message}`);
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
      orderExternalId,
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

    let finalDriverId = driverId; 

    if (!finalDriverId) {
        console.log("Không có driverId từ body, đang tự chọn bốc tài xế rảnh...");
        const driver = await shipperRepository.getRandomAvailableDriver(client);
        if (!driver) throw new Error('No available driver');
        finalDriverId = driver.driverid;
    } else {
        console.log(`Sử dụng driverId từ body: ${finalDriverId}`);
        const driver = await shipperRepository.findById(client, finalDriverId);
        if (!driver) throw new Error('Driver not found');
        finalDriverId = driver.driverid;
    }

    await shipperRepository.updateStatus(client, finalDriverId, 'delivering');

    const updated = await orderRepository.updateOrderStatus(client, {
      orderExternalId,
      fromStatuses: 'confirmed',
      toStatus: 'delivering',
      driverId: finalDriverId
    });

    if (!updated) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    const orderId = updated.id;

    await client.query('COMMIT');

    // Update Redis tracking
    const activeOrderKey = `${ACTIVE_ORDER_PREFIX}${orderId}`;
    await redisClient.hSet(activeOrderKey, 'status', 'delivering');
    await redisClient.hSet(activeOrderKey, 'driverId', finalDriverId);
    if (estimatedDeliveryTime) {
      await redisClient.hSet(activeOrderKey, 'estimatedTime', estimatedDeliveryTime.toString());
    }
    await redisClient.hSet(activeOrderKey, 'deliveryStartedAt', new Date().toISOString());

    // TODO: Emit real-time event
    // emitOrderEvent('order:delivering', { orderId, orderExternalId, driverId });

    logger.info(`Order ${orderId} delivery started by driver ${finalDriverId}`);

    return {
      orderExternalId,
      status: 'delivering',
      driverId: finalDriverId,
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

    const currentOrder = await orderRepository.getOrderDetailByExternalId(orderExternalId);

    const driverId = currentOrder.driver_id || currentOrder.driverId;

    const updated = await orderRepository.updateOrderStatus(client, {
      orderExternalId,
      fromStatuses: 'delivering',
      toStatus: 'completed',
      driverId: driverId
    });

    if (!updated) {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    if (driverId) {
        await shipperRepository.updateStatus(client, driverId, 'available');
        logger.info(`Shipper ${driverId} has been released (available)`);
    }

    const orderId = updated.id;

    // Update payment status (COD paid)
    const paidAt = new Date();
    await orderRepository.updatePaymentStatus(client, {
      orderId,
      status: 'paid',
      paidAt
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
      orderExternalId,
      status: 'completed',
      payment: {
        status: 'paid',
        paidAt
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

    // Can only cancel if status is 'placed'
    const updated = await orderRepository.updateOrderStatus(client, {
      orderExternalId,
      fromStatuses: ['placed'],
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
      orderExternalId,
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
