import {RestaurantRepository} from '../repositories/restaurantRepo.js';

const repo = new RestaurantRepository();

export const getAllRestaurants = async () => {
    const restaurants = await repo.findAll();
    return restaurants;
};

export const searchRestaurants = async ({ name, category } = {}) => {
    const restaurants = await repo.findByFilters({ name, category });
    return restaurants;
};