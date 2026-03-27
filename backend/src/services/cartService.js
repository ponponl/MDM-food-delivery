import redisClient from '../config/redis.js';
import * as menuService from './menu.service.js';
import logger from '../config/logger.js';
import { addOrUpdateItemLua, deleteItemLua } from '../redis/cartScripts.js';
import { buildItemKey, normalizeOptionsForStorage } from '../utils/cartItemKey.js';
import { RestaurantRepository } from '../repositories/restaurantRepo.js';

const CART_PREFIX = 'cart:';
const CART_TTL = 86400; // 24 hours

const restaurantRepository = new RestaurantRepository();

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

const resolveItemImage = (item) => {
  if (!item) return null;
  if (item.image) return item.image;
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  return null;
};

const resolveRestaurantInfo = async (restaurantPublicId, fallbackName = null) => {
  if (!restaurantPublicId) {
    return { restaurantName: fallbackName, restaurantImage: null };
  }

  const restaurant = await restaurantRepository.findByPublicId(restaurantPublicId);
  const restaurantName = restaurant?.name || fallbackName || null;
  const restaurantImage = Array.isArray(restaurant?.images) && restaurant.images.length > 0
    ? restaurant.images[0]
    : null;

  return { restaurantName, restaurantImage };
};

const getGlobalTotalQty = async (userExternalId) => {
  const restaurantsKey = getRestaurantsKey(userExternalId);
  const restaurantIds = await redisClient.sMembers(restaurantsKey);

  if (!restaurantIds || restaurantIds.length === 0) {
    return 0;
  }

  const totalQtyKeys = restaurantIds.map((restaurantId) =>
    getTotalQtyKey(userExternalId, restaurantId)
  );

  const totalsRaw = await redisClient.mGet(totalQtyKeys);
  return (totalsRaw || []).reduce((sum, value) => sum + (Number(value) || 0), 0);
};

const getCartSummary = async (userExternalId, cartKey, totalQtyKey, restaurantPublicId) => {
  const [restaurantTotalQtyRaw, itemCountRaw, totalQtyAll] = await Promise.all([
    redisClient.get(totalQtyKey),
    redisClient.hLen(cartKey),
    getGlobalTotalQty(userExternalId)
  ]);

  return {
    totalQty: Number(totalQtyAll) || 0,
    restaurantTotalQty: Number(restaurantTotalQtyRaw) || 0,
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

    const itemKey = buildItemKey(itemId, options);
    const normalizedOptions = normalizeOptionsForStorage(options);
    const itemImage = resolveItemImage(item);
    const existingItemRaw = await redisClient.hGet(cartKey, itemKey);
    const existingQty = existingItemRaw
      ? Number(JSON.parse(existingItemRaw)?.quantity) || 0
      : 0;
    const nextQty = existingQty + quantity;

    if (typeof item.stock === 'number' && item.stock < nextQty) {
      throw new Error('ITEM_OUT_OF_STOCK');
    }

    const itemJson = JSON.stringify({
      _id: item._id || itemId,
      itemId: item._id || itemId,
      name: item.name || `Item ${itemId}`,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: nextQty,
      image: itemImage,
      options: normalizedOptions,
      note: note || null,
      restaurantId: restaurantPublicId,
      restaurantName: item.restaurantName || null
    });

    await redisClient.eval(addOrUpdateItemLua, {
      keys: [cartKey, totalQtyKey, restaurantsKey],
      arguments: [
        itemKey,
        itemJson,
        String(nextQty),
        String(CART_TTL),
        String(restaurantPublicId)
      ]
    });

    logger.info(`Added ${quantity}x item ${itemId} to cart for user ${userExternalId}`);

    return await getCartSummary(userExternalId, cartKey, totalQtyKey, restaurantPublicId);
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
    const itemImage = resolveItemImage(item);
    const itemJson = JSON.stringify({
      _id: item._id || itemId,
      itemId: item._id || itemId,
      name: item.name || `Item ${itemId}`,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity,
      image: itemImage,
      options: normalizedOptions,
      note: note || null,
      restaurantId: restaurantPublicId,
      restaurantName: item.restaurantName || null
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

    return await getCartSummary(userExternalId, cartKey, totalQtyKey, restaurantPublicId);
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

    return await getCartSummary(userExternalId, cartKey, totalQtyKey, restaurantPublicId);
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

    const parsedItems = Object.entries(cartItems)
      .map(([itemKey, itemJson]) => parseCartItem(itemJson, itemKey))
      .filter(Boolean);

    const missingImageIds = parsedItems
      .filter((item) => item?.itemId && !item.image)
      .map((item) => item.itemId);

    if (missingImageIds.length > 0) {
      const menuItems = await menuService.getMenuItems(missingImageIds);
      parsedItems.forEach((item) => {
        if (!item?.itemId || item.image) return;
        const menuItem = menuItems?.[item.itemId];
        const fallbackImage = resolveItemImage(menuItem);
        if (fallbackImage) {
          item.image = fallbackImage;
        }
      });
    }

    const fallbackName = parsedItems.find((item) => item?.restaurantName)?.restaurantName || null;
    const restaurantInfo = await resolveRestaurantInfo(restaurantPublicId, fallbackName);

    const items = parsedItems.map((item) => ({
      ...item,
      restaurantId: restaurantPublicId,
      restaurantName: restaurantInfo.restaurantName || item.restaurantName || null,
      restaurantImage: restaurantInfo.restaurantImage || item.restaurantImage || null
    }));

    return {
      restaurantId: restaurantPublicId,
      restaurantName: restaurantInfo.restaurantName,
      restaurantImage: restaurantInfo.restaurantImage,
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

    const flattenedItems = restaurants.flatMap((restaurant) =>
      (restaurant.items || []).map((item) => ({
        ...item,
        restaurantId: restaurant.restaurantId || item.restaurantId,
        restaurantName: restaurant.restaurantName || item.restaurantName || null,
        restaurantImage: restaurant.restaurantImage || item.restaurantImage || null
      }))
    );

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
