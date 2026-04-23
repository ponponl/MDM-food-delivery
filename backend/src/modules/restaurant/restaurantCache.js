import redisClient from '../../config/redis.js';

const SUMMARY_CACHE_KEY = 'restaurants:summary:5';
const SUMMARY_CACHE_TTL_SECONDS = 120;
const MENU_CACHE_TTL_SECONDS = 300;
const RESTAURANT_CACHE_TTL_SECONDS = 300;

export const getSummaryCacheKey = () => SUMMARY_CACHE_KEY;
export const getRestaurantInfoCacheKey = (publicId) => `restaurants:info:${publicId}`;
export const getRestaurantMenuCacheKey = (publicId) => `restaurants:menu:${publicId}`;

export const getRestaurantInfoTtlSeconds = () => RESTAURANT_CACHE_TTL_SECONDS;
export const getRestaurantMenuTtlSeconds = () => MENU_CACHE_TTL_SECONDS;
export const getSummaryTtlSeconds = () => SUMMARY_CACHE_TTL_SECONDS;

export const isRedisReady = () => redisClient.isOpen;

export const cacheRestaurantInfo = async (publicId, payload) => {
  if (!redisClient.isOpen || !publicId || !payload) return;
  const key = getRestaurantInfoCacheKey(publicId);
  await redisClient.setEx(key, RESTAURANT_CACHE_TTL_SECONDS, JSON.stringify(payload));
};

export const cacheRestaurantMenu = async (publicId, payload) => {
  if (!redisClient.isOpen || !publicId || !payload) return;
  const key = getRestaurantMenuCacheKey(publicId);
  await redisClient.setEx(key, MENU_CACHE_TTL_SECONDS, JSON.stringify(payload));
};

export const cacheRestaurantSummary = async (payload) => {
  if (!redisClient.isOpen || !payload) return;
  await redisClient.setEx(SUMMARY_CACHE_KEY, SUMMARY_CACHE_TTL_SECONDS, JSON.stringify(payload));
};

export const invalidateRestaurantCache = async (publicId, options = {}) => {
  if (!redisClient.isOpen || !publicId) return;
  const { includeInfo = true, includeMenu = true } = options;
  const keys = [];
  if (includeInfo) keys.push(getRestaurantInfoCacheKey(publicId));
  if (includeMenu) keys.push(getRestaurantMenuCacheKey(publicId));
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};

export const invalidateSummaryCache = async () => {
  if (!redisClient.isOpen) return;
  await redisClient.del(SUMMARY_CACHE_KEY);
};
