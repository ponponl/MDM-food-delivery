import * as restaurantService from '../services/restaurantService.js'

export const getRestaurant = async (req, res) => {
    try {
        const data = await restaurantService.getAllRestaurants();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}