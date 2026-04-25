import redisClient from '../../config/redis.js';
const STOCK_KEY = (itemId) => `stock:item:${String(itemId)}`;

export const menuCache = {
  initStock: async (itemId, quantity) => {
    await redisClient.set(STOCK_KEY(itemId), quantity);
  },

  setItemStock: async(itemId, quantity) => {
    await redisClient.set(STOCK_KEY(itemId), quantity);
  },

  deductStock: async (itemId, quantity) => {
    const key = STOCK_KEY(itemId);
    const remaining = await redisClient.decrBy(key, quantity);

    if (remaining < 0) {
      await redisClient.incrBy(key, quantity);
      return { success: false, remaining: remaining + quantity };
    }
    return { success: true, remaining };
  },
  
  rollbackStock: async (itemId, quantity) => {
    await redisClient.incrBy(STOCK_KEY(itemId), quantity);
  },

  getCurrentStock: async (itemId) => {
    const val = await redisClient.get(STOCK_KEY(itemId));
    return val !== null ? parseInt(val, 10) : null;
  }
};