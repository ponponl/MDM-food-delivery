import redisClient from '../../config/redis.js';

const CUSTOM_GROUP_KEY = (publicId) => `menu:custom_groups:${publicId}`;

export const customizationCache = {
  setGroups: async (publicId, groups) => {
    await redisClient.setEx(CUSTOM_GROUP_KEY(publicId), 86400, JSON.stringify(groups));
  },

  getGroups: async (publicId) => {
    const data = await redisClient.get(CUSTOM_GROUP_KEY(publicId));
    return data ? JSON.parse(data) : null;
  },

  invalidateGroups: async (publicId) => {
    await redisClient.del(CUSTOM_GROUP_KEY(publicId));
  }
};