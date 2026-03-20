import {RestaurantRepository} from '../repositories/restaurantRepo.js';

const repo = new RestaurantRepository();

export const getAllRestaurants = async () => {
    const restaurants = await repo.findAll();
    return restaurants;
};