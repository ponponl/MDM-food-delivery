import * as restaurantService from './restaurantService.js'
import * as categoryService from '../category/categoryService.js'
import redisClient from '../../config/redis.js';

const SUMMARY_CACHE_KEY = 'restaurants:summary:5';
const SUMMARY_CACHE_TTL_SECONDS = 120;
const MENU_CACHE_TTL_SECONDS = 300;
const RESTAURANT_CACHE_TTL_SECONDS = 300;

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
        const infoCacheKey = `restaurants:info:${publicId}`;
        const menuCacheKey = `restaurants:menu:${publicId}`;
        let cachedInfo = null;
        let cachedMenu = null;

        if (redisClient.isOpen) {
            const cachedInfoRaw = await redisClient.get(infoCacheKey);
            if (cachedInfoRaw) {
                try {
                    cachedInfo = JSON.parse(cachedInfoRaw);
                } catch (error) {
                    cachedInfo = null;
                }
            }

            const cachedRaw = await redisClient.get(menuCacheKey);
            if (cachedRaw) {
                try {
                    cachedMenu = JSON.parse(cachedRaw);
                } catch (error) {
                    cachedMenu = null;
                }
            }
        }

        if (cachedInfo && cachedMenu) {
            res.status(200).json({ ...cachedInfo, menu: cachedMenu });
            return;
        }

        const restaurant = cachedInfo && !cachedMenu
            ? await restaurantService.getRestaurantByPublicId(
                publicId,
                { includeMenu: true }
            )
            : cachedInfo
                ? cachedInfo
                : await restaurantService.getRestaurantByPublicId(
                    publicId,
                    { includeMenu: !cachedMenu }
                );

        const restaurantData = restaurant?.toObject ? restaurant.toObject() : restaurant;

        if (!cachedMenu && redisClient.isOpen) {
            await redisClient.setEx(
                menuCacheKey,
                MENU_CACHE_TTL_SECONDS,
                JSON.stringify(restaurantData.menu || [])
            );
        }

        if (!cachedInfo && redisClient.isOpen) {
            const { menu, ...infoPayload } = restaurantData || {};
            await redisClient.setEx(
                infoCacheKey,
                RESTAURANT_CACHE_TTL_SECONDS,
                JSON.stringify(infoPayload)
            );
        }

        const responsePayload = cachedMenu
            ? { ...restaurantData, menu: cachedMenu }
            : restaurantData;

        res.status(200).json(responsePayload);
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

export const getNearest = async (req, res) => {
    try {
        const { lng, lat, distance } = req.query;

        if (!lng || !lat) {
            return res.status(400).json({ message: "Not enough infomation." });
        }

        const restaurants = await restaurantService.getNearestRestaurants(
            parseFloat(lng),
            parseFloat(lat),
            distance ? parseInt(distance) : undefined
        );

        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};