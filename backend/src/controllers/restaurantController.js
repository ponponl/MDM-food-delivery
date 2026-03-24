import * as restaurantService from '../services/restaurantService.js'
import * as categoryService from '../services/categoryService.js'
import redisClient from '../config/redis.js';

const SUMMARY_CACHE_KEY = 'restaurants:summary:5';
const SUMMARY_CACHE_TTL_SECONDS = 120;

export const getRestaurant = async (req, res) => {
    try {
        const { name, category, limit } = req.query;
        const parsedLimit = Number.isNaN(Number(limit)) ? undefined : Number(limit);

        const data = (name || category)
            ? await restaurantService.searchRestaurants({ name, category })
            : await restaurantService.getAllRestaurants(parsedLimit);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getByPublicId = async (req, res) => {
    try {
        const { publicId } = req.params;
        const restaurant = await restaurantService.getRestaurantByPublicId(publicId);
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getSummary = async (req, res) => {
    try {
        if (redisClient.isOpen) {
            const cached = await redisClient.get(SUMMARY_CACHE_KEY);
            if (cached) {
                res.status(200).json(JSON.parse(cached));
                return;
            }
        }

        const categories = await categoryService.getAllCategories();
        const summary = await restaurantService.getRestaurantsSummary(categories, 5);

        if (redisClient.isOpen) {
            await redisClient.setEx(
                SUMMARY_CACHE_KEY,
                SUMMARY_CACHE_TTL_SECONDS,
                JSON.stringify(summary)
            );
        }

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};