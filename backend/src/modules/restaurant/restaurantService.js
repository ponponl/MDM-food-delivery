import { v2 as cloudinary } from 'cloudinary';
import {RestaurantRepository} from './restaurantRepo.js';
import { invalidateRestaurantCache } from './restaurantCache.js';

const repo = new RestaurantRepository();

const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const fileNameWithExtension = parts[parts.length - 1];
  const publicIdWithoutExtension = fileNameWithExtension.split('.')[0];
  const folder = parts[parts.length - 2];
  return `${folder}/${publicIdWithoutExtension}`;
};

export const getAllRestaurants = async (limit) => {
    const restaurants = await repo.findAll(limit);
    return restaurants;
};

export const searchRestaurants = async ({ name, category } = {}) => {
    const restaurants = await repo.findByFilters({ name, category });
    return restaurants;
};

export const getRestaurantByPublicId = async (publicId, { includeMenu = true } = {}) => {
    const restaurant = await repo.findByPublicId(publicId, { includeMenu });
    if (!restaurant) {
        throw new Error('Restaurant not found');
    }
    return restaurant;
}

export const getRestaurantsSummary = async (categories = [], limit = 5) => {
    const summaryEntries = await Promise.all(
        categories.map(async (category) => {
            const items = await repo.findByCategoryLimited(category.slug, limit);
            const normalizedItems = (items || []).map((item) => {
                const payload = item?.toObject ? item.toObject() : item;
                const avgRating = Number.isFinite(Number(payload?.avgRating)) ? Number(payload.avgRating) : 0;
                const totalReview = Number.isFinite(Number(payload?.totalReview)) ? Number(payload.totalReview) : 0;

                return {
                    ...payload,
                    avgRating,
                    totalReview
                };
            });

            return [category.slug, normalizedItems];
        })
    );

    return Object.fromEntries(summaryEntries);
};

export const getNearestRestaurants = async (lng, lat, maxDistance) => {
    return await repo.findNearest(lng, lat, maxDistance);
};

export const getRestaurantsByPublicIds = async (publicIds = [], { includeMenu = false } = {}) => {
    const restaurants = await repo.findByPublicIds(publicIds, { includeMenu });
    return restaurants;
};

export const updateRestaurantDetails = async (publicId, rawBody, file) => {
    const currentRestaurant = await repo.findByPublicId(publicId);
    if (!currentRestaurant) return null;
    const imageUrl = file ? file.path : null;

    if (imageUrl && currentRestaurant.images && currentRestaurant.images.length > 0) {
        try {
            const deletePromises = currentRestaurant.images.map(oldUrl => {
                const cloudinaryPublicId = getPublicIdFromUrl(oldUrl);
                return cloudinary.uploader.destroy(cloudinaryPublicId); 
            });
            await Promise.all(deletePromises);
        } catch (error) {
            console.error("Lỗi khi xóa ảnh cũ trên Cloudinary:", error);
        }
    }

    let addressData = rawBody.address;
    if (typeof addressData === 'string') {
        try { addressData = JSON.parse(addressData); } catch (e) { addressData = undefined; }
    }
    const updateData = {
        name: rawBody.name,
        type: rawBody.type,
        phone: rawBody.phone,
        openTime: rawBody.openTime,
        closeTime: rawBody.closeTime,
        address: addressData
    };
    if (imageUrl) updateData.images = [imageUrl];
    const updatedRestaurant = await repo.updateInfo(publicId, updateData);
    if (updatedRestaurant) {
        await invalidateRestaurantCache(publicId, { includeInfo: true, includeMenu: false });
    }
    return updatedRestaurant;
};