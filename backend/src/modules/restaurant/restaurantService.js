import { v2 as cloudinary } from 'cloudinary';
import {RestaurantRepository} from './restaurantRepo.js';
import { invalidateRestaurantCache } from './restaurantCache.js';
import { MenuRepository } from '../menu/menuRepo.js';

const repo = new RestaurantRepository();
const menuRepo = new MenuRepository();

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
    const restaurant = await repo.findByPublicId(publicId, { includeMenu: false });
    if (!restaurant) {
        throw new Error('Restaurant not found');
    }
    if (!includeMenu) return restaurant;

    const payload = restaurant?.toObject ? restaurant.toObject() : restaurant;
    const menu = await menuRepo.findRestaurantMenu(publicId);
    return { ...payload, menu };
}

export const getRestaurantsSummary = async (categories = [], limit = 5) => {
    const summaryEntries = await Promise.all(
        categories.map(async (category) => {
            const items = await repo.findByCategoryLimited(category.slug, limit);
            const normalizedItems = (items || []).map((item) => {
                return item?.toObject ? item.toObject() : item;
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

export const updateRestaurantDetails = async (publicId, rawBody, files) => {
    const currentRestaurant = await repo.findByPublicId(publicId, { includeMenu: false });
    if (!currentRestaurant) return null;
    const newImageUrl = files?.image?.[0]?.path;
    const newBackgroundUrl = files?.background?.[0]?.path;

    // if (imageUrl && currentRestaurant.images && currentRestaurant.images.length > 0) {
    //     try {
    //         const deletePromises = currentRestaurant.images.map(oldUrl => {
    //             const cloudinaryPublicId = getPublicIdFromUrl(oldUrl);
    //             return cloudinary.uploader.destroy(cloudinaryPublicId); 
    //         });
    //         await Promise.all(deletePromises);
    //     } catch (error) {
    //         console.error("Lỗi khi xóa ảnh cũ trên Cloudinary:", error);
    //     }
    // }

    if (newImageUrl && currentRestaurant.images?.length > 0) {
        const oldPublicId = getPublicIdFromUrl(currentRestaurant.images[0]);
        await cloudinary.uploader.destroy(oldPublicId);
    }

    if (newBackgroundUrl && currentRestaurant.background?.length > 0) {
        const oldBackId = getPublicIdFromUrl(currentRestaurant.background[0]);
        await cloudinary.uploader.destroy(oldBackId);
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
    // if (imageUrl) updateData.images = [imageUrl];
    if (newImageUrl) updateData.images = [newImageUrl];
    if (newBackgroundUrl) updateData.background = [newBackgroundUrl];
    const updatedRestaurant = await repo.updateInfo(publicId, updateData);
    if (updatedRestaurant) {
        await invalidateRestaurantCache(publicId, { includeInfo: true, includeMenu: false });
    }
    return updatedRestaurant;
};