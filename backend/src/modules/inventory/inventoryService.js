import { InventoryRepository } from './inventoryRepo.js';
import { RestaurantRepository } from '../restaurant/restaurantRepo.js';
import logger from '../../config/logger.js';
import {
  getRemainingInventoryCache,
  getRemainingInventoryCacheBulk,
  invalidateRemainingInventoryCache,
  setRemainingInventoryCache
} from './inventoryCache.js';

const inventoryRepo = new InventoryRepository();
const restaurantRepo = new RestaurantRepository();

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Ho_Chi_Minh';

const formatBusinessDate = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  return formatter.format(date);
};

export const resolveRestaurantTimezone = (restaurant) => {
  return restaurant?.timezone || restaurant?.timeZone || DEFAULT_TIMEZONE;
};

export const getBusinessDate = (timeZone, baseDate = new Date()) => {
  try {
    return formatBusinessDate(baseDate, timeZone || DEFAULT_TIMEZONE);
  } catch (error) {
    logger.warn(`Invalid timezone ${timeZone}, falling back to default.`);
    return formatBusinessDate(baseDate, DEFAULT_TIMEZONE);
  }
};

const parseNumberOrDefault = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildRemainingPayload = (inventoryDoc, fallbackTotal) => {
  const totalQuantity = inventoryDoc
    ? parseNumberOrDefault(inventoryDoc.totalQuantity, 0)
    : parseNumberOrDefault(fallbackTotal, 0);
  const soldQuantity = inventoryDoc
    ? parseNumberOrDefault(inventoryDoc.soldQuantity, 0)
    : 0;
  const remainingQuantity = Math.max(0, totalQuantity - soldQuantity);

  return {
    remainingQuantity,
    totalQuantity,
    soldQuantity
  };
};

const refreshRemainingCache = async ({
  menuItemId,
  restaurantId,
  businessDate,
  fallbackTotal
}) => {
  const inventoryDoc = await inventoryRepo.findDailyInventory({
    menuItemId,
    restaurantId,
    date: businessDate
  });

  if (!inventoryDoc) {
    await invalidateRemainingInventoryCache({
      restaurantId,
      businessDate,
      menuItemIds: [menuItemId]
    });
    return buildRemainingPayload(null, fallbackTotal);
  }

  const payload = buildRemainingPayload(inventoryDoc, fallbackTotal);
  await setRemainingInventoryCache({
    restaurantId,
    businessDate,
    menuItemId,
    ...payload
  });
  return payload;
};

const buildInventoryPayload = (menuItem, inventoryDoc) => {
  const totalQuantity = inventoryDoc
    ? parseNumberOrDefault(inventoryDoc.totalQuantity, 0)
    : parseNumberOrDefault(menuItem?.stock, 0);
  const soldQuantity = inventoryDoc
    ? parseNumberOrDefault(inventoryDoc.soldQuantity, 0)
    : 0;
  const remainingQuantity = Math.max(0, totalQuantity - soldQuantity);

  return {
    ...menuItem,
    totalQuantity,
    soldQuantity,
    remainingQuantity
  };
};

export const attachInventoryToMenuItems = async ({
  menuItems,
  restaurantId,
  businessDate
}) => {
  if (!Array.isArray(menuItems) || menuItems.length === 0) {
    return [];
  }

  if (!restaurantId || !businessDate) {
    return menuItems.map((item) => buildInventoryPayload(item, null));
  }

  const menuItemIds = menuItems
    .map((item) => item?.itemId || item?._id)
    .filter(Boolean);

  if (menuItemIds.length === 0) {
    return menuItems.map((item) => buildInventoryPayload(item, null));
  }

  const inventories = await inventoryRepo.findDailyInventories({
    restaurantId,
    date: businessDate,
    menuItemIds
  });

  const cachedMap = await getRemainingInventoryCacheBulk({
    restaurantId,
    businessDate,
    menuItemIds
  });

  const inventoryMap = new Map(
    (inventories || []).map((doc) => [String(doc.menuItemId), doc])
  );

  return menuItems.map((item) => {
    const itemId = item?.itemId || item?._id;
    if (!itemId) return buildInventoryPayload(item, null);

    const cached = cachedMap.get(String(itemId));
    if (cached) {
      return {
        ...item,
        totalQuantity: cached.totalQuantity,
        soldQuantity: cached.soldQuantity,
        remainingQuantity: cached.remainingQuantity
      };
    }

    const inventoryDoc = inventoryMap.get(String(itemId)) || null;
    const payload = buildInventoryPayload(item, inventoryDoc);
    setRemainingInventoryCache({
      restaurantId,
      businessDate,
      menuItemId: itemId,
      remainingQuantity: payload.remainingQuantity,
      totalQuantity: payload.totalQuantity,
      soldQuantity: payload.soldQuantity
    });
    return payload;
  });
};

export const getMenuItemWithInventory = async (menuItem) => {
  if (!menuItem) {
    return null;
  }

  const restaurantId = menuItem.restaurantId || menuItem.restaurant_id;
  if (!restaurantId) {
    return buildInventoryPayload(menuItem, null);
  }

  const restaurant = await restaurantRepo.findById(restaurantId);
  const timezone = resolveRestaurantTimezone(restaurant);
  const businessDate = getBusinessDate(timezone);

  const inventoryDoc = await inventoryRepo.findDailyInventory({
    menuItemId: menuItem.itemId || menuItem._id,
    restaurantId,
    date: businessDate
  });

  return buildInventoryPayload(menuItem, inventoryDoc || null);
};

export const reserveInventoryForItem = async ({
  menuItem,
  quantity,
  businessDate
}) => {
  const restaurantId = menuItem?.restaurantId || menuItem?.restaurant_id;
  const menuItemId = menuItem?.itemId || menuItem?._id;
  const totalQuantity = parseNumberOrDefault(menuItem?.stock, 0);

  if (!menuItemId || !restaurantId) {
    return { success: false, remaining: 0 };
  }

  await inventoryRepo.ensureDailyInventory({
    menuItemId,
    restaurantId,
    date: businessDate,
    totalQuantity
  });

  const reserved = await inventoryRepo.reserveStockAtomic({
    menuItemId,
    restaurantId,
    date: businessDate,
    quantity
  });

  if (reserved) {
    await refreshRemainingCache({
      menuItemId,
      restaurantId,
      businessDate,
      fallbackTotal: totalQuantity
    });
    return { success: true, remaining: null };
  }

  const payload = await refreshRemainingCache({
    menuItemId,
    restaurantId,
    businessDate,
    fallbackTotal: totalQuantity
  });

  return { success: false, remaining: payload.remainingQuantity };
};

export const rollbackInventoryForItem = async ({
  menuItemId,
  restaurantId,
  businessDate,
  quantity
}) => {
  if (!menuItemId || !restaurantId || !quantity) {
    return false;
  }

  const rolledBack = await inventoryRepo.rollbackStockAtomic({
    menuItemId,
    restaurantId,
    date: businessDate,
    quantity
  });

  if (rolledBack) {
    await refreshRemainingCache({
      menuItemId,
      restaurantId,
      businessDate,
      fallbackTotal: 0
    });
  } else {
    await invalidateRemainingInventoryCache({
      restaurantId,
      businessDate,
      menuItemIds: [menuItemId]
    });
  }

  return rolledBack;
};

export const getRemainingQuantity = async ({
  menuItem,
  businessDate
}) => {
  if (!menuItem) {
    return { remainingQuantity: 0, totalQuantity: 0, soldQuantity: 0 };
  }

  const restaurantId = menuItem.restaurantId || menuItem.restaurant_id;
  const menuItemId = menuItem.itemId || menuItem._id;
  const totalQuantity = parseNumberOrDefault(menuItem.stock, 0);

  if (!restaurantId || !menuItemId) {
    return {
      remainingQuantity: totalQuantity,
      totalQuantity,
      soldQuantity: 0
    };
  }

  const cached = await getRemainingInventoryCache({
    restaurantId,
    businessDate,
    menuItemId
  });

  if (cached) {
    return cached;
  }

  const inventoryDoc = await inventoryRepo.findDailyInventory({
    menuItemId,
    restaurantId,
    date: businessDate
  });

  if (!inventoryDoc) {
    const payload = buildRemainingPayload(null, totalQuantity);
    await setRemainingInventoryCache({
      restaurantId,
      businessDate,
      menuItemId,
      ...payload
    });
    return payload;
  }

  const payload = buildRemainingPayload(inventoryDoc, totalQuantity);
  await setRemainingInventoryCache({
    restaurantId,
    businessDate,
    menuItemId,
    ...payload
  });
  return payload;
};

export const getRestaurantByPublicId = async (publicId) => {
  if (!publicId) return null;
  return await restaurantRepo.findByPublicId(publicId, { includeMenu: false });
};
