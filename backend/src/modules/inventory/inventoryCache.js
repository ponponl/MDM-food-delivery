import redisClient from '../../config/redis.js';

const INVENTORY_CACHE_PREFIX = 'inventory:remaining';
const DEFAULT_TTL_SECONDS = Number.parseInt(
  process.env.INVENTORY_CACHE_TTL_SECONDS || '30',
  10
);

const isRedisReady = () => Boolean(redisClient?.isOpen);

export const getInventoryCacheTtlSeconds = () => {
  if (Number.isFinite(DEFAULT_TTL_SECONDS) && DEFAULT_TTL_SECONDS > 0) {
    return DEFAULT_TTL_SECONDS;
  }
  return 30;
};

export const getInventoryCacheKey = ({ restaurantId, businessDate, menuItemId }) => (
  `${INVENTORY_CACHE_PREFIX}:${String(restaurantId)}:${String(businessDate)}:${String(menuItemId)}`
);

export const getRemainingInventoryCache = async ({
  restaurantId,
  businessDate,
  menuItemId
}) => {
  if (!isRedisReady() || !restaurantId || !businessDate || !menuItemId) {
    return null;
  }

  const key = getInventoryCacheKey({ restaurantId, businessDate, menuItemId });
  const raw = await redisClient.get(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.remainingQuantity !== 'number') {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

export const getRemainingInventoryCacheBulk = async ({
  restaurantId,
  businessDate,
  menuItemIds
}) => {
  if (!isRedisReady() || !restaurantId || !businessDate) {
    return new Map();
  }

  const ids = Array.isArray(menuItemIds) ? menuItemIds : [menuItemIds];
  const normalizedIds = ids.filter(Boolean).map((id) => String(id));
  if (normalizedIds.length === 0) {
    return new Map();
  }

  const keys = normalizedIds.map((menuItemId) =>
    getInventoryCacheKey({ restaurantId, businessDate, menuItemId })
  );
  const values = await redisClient.mGet(keys);
  const result = new Map();

  values.forEach((raw, index) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.remainingQuantity !== 'number') {
        return;
      }
      result.set(normalizedIds[index], parsed);
    } catch (error) {
      return;
    }
  });

  return result;
};

export const setRemainingInventoryCache = async ({
  restaurantId,
  businessDate,
  menuItemId,
  remainingQuantity,
  totalQuantity,
  soldQuantity
}) => {
  if (!isRedisReady() || !restaurantId || !businessDate || !menuItemId) {
    return false;
  }

  const key = getInventoryCacheKey({ restaurantId, businessDate, menuItemId });
  const payload = JSON.stringify({
    remainingQuantity,
    totalQuantity,
    soldQuantity
  });
  const ttlSeconds = getInventoryCacheTtlSeconds();

  await redisClient.set(key, payload, { EX: ttlSeconds });
  return true;
};

export const invalidateRemainingInventoryCache = async ({
  restaurantId,
  businessDate,
  menuItemIds
}) => {
  if (!isRedisReady() || !restaurantId || !businessDate) {
    return 0;
  }

  const ids = Array.isArray(menuItemIds) ? menuItemIds : [menuItemIds];
  const keys = ids
    .filter(Boolean)
    .map((menuItemId) => getInventoryCacheKey({ restaurantId, businessDate, menuItemId }));

  if (keys.length === 0) return 0;
  return await redisClient.del(keys);
};
