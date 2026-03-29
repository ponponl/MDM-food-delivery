import {RestaurantRepository} from './restaurantRepo.js';

const repo = new RestaurantRepository();

export const getAllRestaurants = async (limit) => {
    const restaurants = await repo.findAll(limit);
    return restaurants;
};

export const searchRestaurants = async ({ name, category } = {}) => {
    const restaurants = await repo.findByFilters({ name, category });
    return restaurants;
};

export const getRestaurantByPublicId = async (publicId) => {
    const restaurant = await repo.findByPublicId(publicId);
    if (!restaurant) {
        throw new Error('Restaurant not found');
    }
    return restaurant;
}

export const getRestaurantsSummary = async (categories = [], limit = 5) => {
    const summaryEntries = await Promise.all(
        categories.map(async (category) => {
            const items = await repo.findByCategoryLimited(category.slug, limit);
            return [category.slug, items];
        })
    );

    return Object.fromEntries(summaryEntries);
};