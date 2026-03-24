import redisClient from '../config/redis.js';
import * as menuService from './menu.service.js';
import logger from '../config/logger.js';

const CART_PREFIX = 'cart:';
const CART_TTL = 86400; // 24 hours
const MAX_CART_ITEMS = 50;

const getCartKey = (userExternalId) => `${CART_PREFIX}${userExternalId}`;

export const addItemToCart = async (userExternalId, itemId, quantity) => {
  try {
    const cartKey = getCartKey(userExternalId);

    const item = await menuService.getMenuItem(itemId);
    if (!item) {
      throw new Error('ITEM_NOT_FOUND');
    }

    if (!item.available) {
      throw new Error('ITEM_UNAVAILABLE');
    }

    if (typeof item.stock === 'number' && item.stock < quantity) {
      throw new Error('ITEM_OUT_OF_STOCK');
    }

    // Check current cart size
    const currentSize = await redisClient.hLen(cartKey);
    if (currentSize >= MAX_CART_ITEMS) {
      throw new Error(`Cart cannot exceed ${MAX_CART_ITEMS} items`);
    }

    // Increment quantity in Redis
    await redisClient.hIncrBy(cartKey, itemId.toString(), quantity);

    // Set expiration
    await redisClient.expire(cartKey, CART_TTL);

    // Get cart summary
    const totalItems = await getTotalItems(cartKey);

    logger.info(`Added ${quantity}x item ${itemId} to cart for user ${userExternalId}`);

    return {
      totalItems,
      items: [{ itemId: itemId.toString(), quantity }]
    };

  } catch (error) {
    logger.error(`Error in addItemToCart: ${error.message}`);
    throw error;
  }
};

export const getCart = async (userExternalId) => {
  try {
    const cartKey = getCartKey(userExternalId);

    // Get all items from cart
    const cartItems = await redisClient.hGetAll(cartKey);

    if (!cartItems || Object.keys(cartItems).length === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0
      };
    }

    const itemIds = Object.keys(cartItems);
    const menuItems = await menuService.getMenuItems(itemIds);
    const items = [];
    let totalPrice = 0;
    let totalItems = 0;

    for (const [itemId, quantity] of Object.entries(cartItems)) {
      const qty = parseInt(quantity);
      const itemDetails = menuItems[itemId];
      const price = typeof itemDetails?.price === 'number' ? itemDetails.price : 0;
      const subtotal = price * qty;
      totalPrice += subtotal;
      totalItems += qty;

      items.push({
        itemId,
        name: itemDetails?.name || `Item ${itemId}`,
        price,
        available: itemDetails?.available ?? false,
        stock: itemDetails?.stock ?? 0,
        quantity: qty,
        subtotal
      });
    }

    return {
      items,
      totalItems,
      totalPrice
    };

  } catch (error) {
    logger.error(`Error in getCart: ${error.message}`);
    throw error;
  }
};

export const updateItemQuantity = async (userExternalId, itemId, quantity) => {
  try {
    const cartKey = getCartKey(userExternalId);

    if (quantity === 0) {
      // Remove item if quantity is 0
      await redisClient.hDel(cartKey, itemId.toString());
      logger.info(`Removed item ${itemId} from cart for user ${userExternalId}`);
    } else {
      const item = await menuService.getMenuItem(itemId);
      if (!item) {
        throw new Error('ITEM_NOT_FOUND');
      }

      if (!item.available) {
        throw new Error('ITEM_UNAVAILABLE');
      }

      if (typeof item.stock === 'number' && item.stock < quantity) {
        throw new Error('ITEM_OUT_OF_STOCK');
      }

      // Set new quantity
      await redisClient.hSet(cartKey, itemId.toString(), quantity.toString());
      await redisClient.expire(cartKey, CART_TTL);
      logger.info(`Updated item ${itemId} to quantity ${quantity} for user ${userExternalId}`);
    }

    // Return updated cart summary
    const totalItems = await getTotalItems(cartKey);

    return {
      totalItems,
      items: [{ itemId: itemId.toString(), quantity }]
    };

  } catch (error) {
    logger.error(`Error in updateItemQuantity: ${error.message}`);
    throw error;
  }
};

export const removeItemFromCart = async (userExternalId, itemId) => {
  try {
    const cartKey = getCartKey(userExternalId);
    await redisClient.hDel(cartKey, itemId.toString());

    logger.info(`Removed item ${itemId} from cart for user ${userExternalId}`);

  } catch (error) {
    logger.error(`Error in removeItemFromCart: ${error.message}`);
    throw error;
  }
};

export const clearCart = async (userExternalId) => {
  try {
    const cartKey = getCartKey(userExternalId);
    await redisClient.del(cartKey);

    logger.info(`Cleared cart for user ${userExternalId}`);

  } catch (error) {
    logger.error(`Error in clearCart: ${error.message}`);
    throw error;
  }
};

export const getCartItems = async (userExternalId) => {
  try {
    const cartKey = getCartKey(userExternalId);
    const cartItems = await redisClient.hGetAll(cartKey);
    return cartItems || {};
  } catch (error) {
    logger.error(`Error in getCartItems: ${error.message}`);
    throw error;
  }
};

const getTotalItems = async (cartKey) => {
  const items = await redisClient.hGetAll(cartKey);
  if (!items) return 0;

  return Object.values(items).reduce((sum, qty) => sum + parseInt(qty), 0);
};
