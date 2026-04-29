import * as restaurantService from './restaurantService.js'
import * as categoryService from '../category/categoryService.js'
import redisClient from '../../config/redis.js';
import {
    cacheRestaurantInfo,
    cacheRestaurantMenu,
    cacheRestaurantSummary,
    getRestaurantInfoCacheKey,
    getRestaurantInfoTtlSeconds,
    getRestaurantMenuCacheKey,
    getSummaryCacheKey,
    isRedisReady
} from './restaurantCache.js';

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
        const infoCacheKey = getRestaurantInfoCacheKey(publicId);
        const menuCacheKey = getRestaurantMenuCacheKey(publicId);
        let cachedInfo = null;
        let cachedMenu = null;

        // if (isRedisReady()) {
        //     const cachedInfoRaw = await redisClient.get(infoCacheKey);
        //     if (cachedInfoRaw) {
        //         try {
        //             cachedInfo = JSON.parse(cachedInfoRaw);
        //         } catch (error) {
        //             cachedInfo = null;
        //         }
        //     }

        //     const cachedRaw = await redisClient.get(menuCacheKey);
        //     if (cachedRaw) {
        //         try {
        //             cachedMenu = JSON.parse(cachedRaw);
        //         } catch (error) {
        //             cachedMenu = null;
        //         }
        //     }
        // }

        // if (cachedInfo && cachedMenu) {
        //     res.status(200).json({ ...cachedInfo, menu: cachedMenu });
        //     return;
        // }

        // const restaurant = cachedInfo && !cachedMenu
        //     ? await restaurantService.getRestaurantByPublicId(
        //         publicId,
        //         { includeMenu: true }
        //     )
        //     : cachedInfo
        //         ? cachedInfo
        //         : await restaurantService.getRestaurantByPublicId(
        //             publicId,
        //             { includeMenu: !cachedMenu }
        //         );

        // const restaurantData = restaurant?.toObject ? restaurant.toObject() : restaurant;

        // if (!cachedMenu && isRedisReady()) {
        //     await cacheRestaurantMenu(publicId, restaurantData.menu || []);
        // }

        // if (!cachedInfo && isRedisReady()) {
        //     const { menu, ...infoPayload } = restaurantData || {};
        //     await cacheRestaurantInfo(publicId, infoPayload);
        // }

        // const responsePayload = cachedMenu
        //     ? { ...restaurantData, menu: cachedMenu }
        //     : restaurantData;

        if (isRedisReady()) {
            const [infoRaw, menuRaw] = await Promise.all([
                redisClient.get(infoCacheKey),
                redisClient.get(menuCacheKey)
            ]);
            if (infoRaw) cachedInfo = JSON.parse(infoRaw);
            if (menuRaw) cachedMenu = JSON.parse(menuRaw);
        }

        let restaurantData;
        if (cachedInfo && cachedMenu) {
            restaurantData = { ...cachedInfo, menu: cachedMenu };
        } else {
            const restaurant = await restaurantService.getRestaurantByPublicId(
                publicId,
                { includeMenu: true }
            );
            restaurantData = restaurant?.toObject ? restaurant.toObject() : restaurant;
            
            // Cập nhật lại cache nếu cần
            if (isRedisReady()) {
                if (!cachedMenu) await cacheRestaurantMenu(publicId, restaurantData.menu || []);
                if (!cachedInfo) {
                    const { menu, ...infoPayload } = restaurantData || {};
                    await cacheRestaurantInfo(publicId, infoPayload);
                }
            }
        }

        if (restaurantData.menu && restaurantData.menu.length > 0 && isRedisReady()) {
            const stockKeys = restaurantData.menu.map(item => `stock:item:${item.itemId || item._id}`);
            const redisStocks = await redisClient.mGet(stockKeys);
            const pipeline = redisClient.multi();
            let hasMissingStock = false;
            restaurantData.menu = restaurantData.menu.map((item, index) => {
                const liveStock = redisStocks[index];
                const itemId = item.itemId || item._id;
                if (liveStock === null) {
                    pipeline.set(`stock:item:${itemId}`, item.stock);
                    hasMissingStock = true;
                    return item; 
                }
                return {
                    ...item,
                    stock: liveStock !== null ? parseInt(liveStock, 10) : item.stock 
                };
            });
            if (hasMissingStock) {
                await pipeline.exec();
            }
        }

        res.status(200).json(restaurantData);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getSummary = async (req, res) => {
    try {
        if (isRedisReady()) {
            const cached = await redisClient.get(getSummaryCacheKey());
            if (cached) {
                res.status(200).json(JSON.parse(cached));
                return;
            }
        }

        const categories = await categoryService.getAllCategories();
        const summary = await restaurantService.getRestaurantsSummary(categories, 5);

        if (isRedisReady()) {
            await cacheRestaurantSummary(summary);
        }

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getBulkByPublicIds = async (req, res) => {
    try {
        const rawIds = req.query.ids;
        const ids = Array.isArray(rawIds)
            ? rawIds
            : typeof rawIds === 'string'
                ? rawIds.split(',')
                : [];

        const uniqueIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];

        if (uniqueIds.length === 0) {
            res.status(400).json({ error: 'ids is required' });
            return;
        }

        const cachedMap = {};
        let missingIds = uniqueIds;

        if (isRedisReady()) {
            const cacheKeys = uniqueIds.map((id) => getRestaurantInfoCacheKey(id));
            const cachedValues = await redisClient.mGet(cacheKeys);
            const stillMissing = [];

            cachedValues.forEach((value, index) => {
                const publicId = uniqueIds[index];
                if (value) {
                    try {
                        cachedMap[publicId] = JSON.parse(value);
                    } catch (error) {
                        stillMissing.push(publicId);
                    }
                } else {
                    stillMissing.push(publicId);
                }
            });

            missingIds = stillMissing;
        }

        if (missingIds.length > 0) {
            const restaurants = await restaurantService.getRestaurantsByPublicIds(missingIds, { includeMenu: false });
            const fetchedMap = {};

            restaurants.forEach((restaurant) => {
                if (!restaurant?.publicId) return;
                const { _id, menu, ...payload } = restaurant || {};
                fetchedMap[restaurant.publicId] = payload;
            });

            if (isRedisReady()) {
                const pipeline = redisClient.multi();
                Object.entries(fetchedMap).forEach(([publicId, payload]) => {
                    pipeline.setEx(
                        getRestaurantInfoCacheKey(publicId),
                        getRestaurantInfoTtlSeconds(),
                        JSON.stringify(payload)
                    );
                });
                await pipeline.exec();
            }

            missingIds.forEach((publicId) => {
                if (fetchedMap[publicId]) {
                    cachedMap[publicId] = fetchedMap[publicId];
                }
            });
        }

        res.status(200).json({ restaurants: cachedMap });
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

export const updateRestaurantInfo = async (req, res) => {
    try {
        const { publicId } = req.body;
        if (!publicId) return res.status(400).json({ message: "Thiếu publicId" });
        const result = await restaurantService.updateRestaurantDetails(
            publicId, 
            req.body, 
            req.files
        );

        if (!result) return res.status(404).json({ message: "Không tìm thấy nhà hàng" });

        res.status(200).json({ message: "Cập nhật thành công", restaurant: result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};