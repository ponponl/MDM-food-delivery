import redisClient from '../config/redis.js';
import * as menuService from './menu.service.js';
import logger from '../config/logger.js';
import { addOrUpdateItemLua, deleteItemLua } from '../redis/cartScripts.js';
import { buildItemKey, normalizeOptionsForStorage } from '../utils/cartItemKey.js';

const CART_PREFIX = 'cart:';
const CART_TTL = 86400; // 24 hours

const getCartKey = (userExternalId, restaurantPublicId) =>
  `${CART_PREFIX}${userExternalId}:${restaurantPublicId}`;

const getTotalQtyKey = (userExternalId, restaurantPublicId) =>
  `${CART_PREFIX}${userExternalId}:${restaurantPublicId}:totalQty`;

const getRestaurantsKey = (userExternalId) => `${CART_PREFIX}${userExternalId}:restaurants`;

const parseCartItem = (itemJson, itemKey) => {
  try {
    const parsed = JSON.parse(itemJson);
    const quantity = Number(parsed?.quantity) || 0;
    const price = Number(parsed?.price) || 0;
    return {
      ...parsed,
      itemKey,
      subtotal: quantity * price
    };
  } catch (error) {
    logger.error(`Failed to parse cart item JSON: ${error.message}`);
    return null;
  }
};

const getCartSummary = async (cartKey, totalQtyKey, restaurantPublicId) => {
  const [totalQtyRaw, itemCountRaw] = await Promise.all([
    redisClient.get(totalQtyKey),
    redisClient.hLen(cartKey)
  ]);

  return {
    totalQty: Number(totalQtyRaw) || 0,
    itemCount: Number(itemCountRaw) || 0,
    restaurantId: restaurantPublicId
  };
};

export const addItemToCart = async (
  userExternalId,
  restaurantPublicId,
  itemId,
  quantity,
  options = [],
  note = null
) => {
  try {
    const cartKey = getCartKey(userExternalId, restaurantPublicId);
    const totalQtyKey = getTotalQtyKey(userExternalId, restaurantPublicId);
    const restaurantsKey = getRestaurantsKey(userExternalId);

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

    const itemKey = buildItemKey(itemId, options);
    const normalizedOptions = normalizeOptionsForStorage(options);
    const itemJson = JSON.stringify({
      _id: item._id || itemId,
      itemId: item._id || itemId,
      name: item.name || `Item ${itemId}`,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity,
      image: item.image || null,
      options: normalizedOptions,
      note: note || null,
      restaurantId: restaurantPublicId
    });

    await redisClient.eval(addOrUpdateItemLua, {
      keys: [cartKey, totalQtyKey, restaurantsKey],
      arguments: [
        itemKey,
        itemJson,
        String(quantity),
        String(CART_TTL),
        String(restaurantPublicId)
      ]
    });

    logger.info(`Added ${quantity}x item ${itemId} to cart for user ${userExternalId}`);

    return await getCartSummary(cartKey, totalQtyKey, restaurantPublicId);
  } catch (error) {
    logger.error(`Error in addItemToCart: ${error.message}`);
    throw error;
  }
};

export const updateItemQuantity = async (
  userExternalId,
  restaurantPublicId,
  itemId,
  quantity,
  options = [],
  note = null
) => {
  try {
    if (quantity === 0) {
      return await removeItemFromCart(userExternalId, restaurantPublicId, itemId, options);
    }

    const cartKey = getCartKey(userExternalId, restaurantPublicId);
    const totalQtyKey = getTotalQtyKey(userExternalId, restaurantPublicId);
    const restaurantsKey = getRestaurantsKey(userExternalId);

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

    const itemKey = buildItemKey(itemId, options);
    const normalizedOptions = normalizeOptionsForStorage(options);
    const itemJson = JSON.stringify({
      _id: item._id || itemId,
      itemId: item._id || itemId,
      name: item.name || `Item ${itemId}`,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity,
      image: item.image || null,
      options: normalizedOptions,
      note: note || null,
      restaurantId: restaurantPublicId
    });

    await redisClient.eval(addOrUpdateItemLua, {
      keys: [cartKey, totalQtyKey, restaurantsKey],
      arguments: [
        itemKey,
        itemJson,
        String(quantity),
        String(CART_TTL),
        String(restaurantPublicId)
      ]
    });

    logger.info(`Updated item ${itemId} to quantity ${quantity} for user ${userExternalId}`);

    return await getCartSummary(cartKey, totalQtyKey, restaurantPublicId);
  } catch (error) {
    logger.error(`Error in updateItemQuantity: ${error.message}`);
    throw error;
  }
};

export const removeItemFromCart = async (
  userExternalId,
  restaurantPublicId,
  itemId,
  options = [],
  itemKeyOverride = null
) => {
  try {
    const cartKey = getCartKey(userExternalId, restaurantPublicId);
    const totalQtyKey = getTotalQtyKey(userExternalId, restaurantPublicId);
    const restaurantsKey = getRestaurantsKey(userExternalId);

    const itemKey = itemKeyOverride || buildItemKey(itemId, options);

    await redisClient.eval(deleteItemLua, {
      keys: [cartKey, totalQtyKey, restaurantsKey],
      arguments: [itemKey, String(restaurantPublicId)]
    });

    logger.info(`Removed item ${itemId} from cart for user ${userExternalId}`);

    return await getCartSummary(cartKey, totalQtyKey, restaurantPublicId);
  } catch (error) {
    logger.error(`Error in removeItemFromCart: ${error.message}`);
    throw error;
  }
};

export const getCartByRestaurant = async (userExternalId, restaurantPublicId) => {
  try {
    const cartKey = getCartKey(userExternalId, restaurantPublicId);
    const totalQtyKey = getTotalQtyKey(userExternalId, restaurantPublicId);

    const [cartItems, totalQtyRaw] = await Promise.all([
      redisClient.hGetAll(cartKey),
      redisClient.get(totalQtyKey)
    ]);

    if (!cartItems || Object.keys(cartItems).length === 0) {
      return {
        restaurantId: restaurantPublicId,
        totalQty: 0,
        itemCount: 0,
        items: []
      };
    }

    const items = Object.entries(cartItems)
      .map(([itemKey, itemJson]) => parseCartItem(itemJson, itemKey))
      .filter(Boolean);

    return {
      restaurantId: restaurantPublicId,
      totalQty: Number(totalQtyRaw) || 0,
      itemCount: items.length,
      items
    };
  } catch (error) {
    logger.error(`Error in getCartByRestaurant: ${error.message}`);
    throw error;
  }
};

export const getCart = async (userExternalId) => {
  try {
    const restaurantsKey = getRestaurantsKey(userExternalId);
    const restaurantIds = await redisClient.sMembers(restaurantsKey);

    if (!restaurantIds || restaurantIds.length === 0) {
      return {
        restaurants: [],
        totalQty: 0,
        itemCount: 0
      };
    }

    const restaurants = await Promise.all(
      restaurantIds.map((restaurantId) => getCartByRestaurant(userExternalId, restaurantId))
    );

    const totals = restaurants.reduce(
      (summary, restaurant) => {
        summary.totalQty += restaurant.totalQty || 0;
        summary.itemCount += restaurant.itemCount || 0;
        return summary;
      },
      { totalQty: 0, itemCount: 0 }
    );

    const flattenedItems = restaurants.flatMap((restaurant) => restaurant.items || []);

    return {
      restaurants,
      totalQty: totals.totalQty,
      itemCount: totals.itemCount,
      items: flattenedItems
    };
  } catch (error) {
    logger.error(`Error in getCart: ${error.message}`);
    throw error;
  }
};

export const clearCart = async (userExternalId) => {
  try {
    const restaurantsKey = getRestaurantsKey(userExternalId);
    const restaurantIds = await redisClient.sMembers(restaurantsKey);

    const pipeline = redisClient.multi();
    restaurantIds.forEach((restaurantId) => {
      pipeline.del(
        getCartKey(userExternalId, restaurantId),
        getTotalQtyKey(userExternalId, restaurantId)
      );
    });
    pipeline.del(restaurantsKey);

    await pipeline.exec();

    logger.info(`Cleared cart for user ${userExternalId}`);
  } catch (error) {
    logger.error(`Error in clearCart: ${error.message}`);
    throw error;
  }
};

export const getCartItems = async (userExternalId, restaurantPublicId) => {
  try {
    const cart = await getCartByRestaurant(userExternalId, restaurantPublicId);
    return cart.items || [];
  } catch (error) {
    logger.error(`Error in getCartItems: ${error.message}`);
    throw error;
  }
};
