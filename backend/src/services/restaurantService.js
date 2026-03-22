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

export const getRestaurantById = async (id) => {
    const restaurant = await repo.findById(id);
    if (!restaurant) {
        throw new Error('Restaurant not found');
    }
    return restaurant;
}