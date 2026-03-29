import * as categoryService from './categoryService.js';
import redisClient from '../../config/redis.js';

const CATEGORY_CACHE_KEY = 'categories:all';
const CATEGORY_CACHE_TTL_SECONDS = 3600;

export const getCategories = async (req, res) => {
    try {
        if (redisClient.isOpen) {
            const cached = await redisClient.get(CATEGORY_CACHE_KEY);
            if (cached) {
                res.status(200).json(JSON.parse(cached));
                return;
            }
        }

        const categories = await categoryService.getAllCategories();

        if (redisClient.isOpen) {
            await redisClient.setEx(
                CATEGORY_CACHE_KEY,
                CATEGORY_CACHE_TTL_SECONDS,
                JSON.stringify(categories)
            );
        }

        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
