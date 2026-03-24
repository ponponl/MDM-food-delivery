import * as restaurantService from '../services/restaurantService.js'
import * as categoryService from '../services/categoryService.js'

export const getRestaurant = async (req, res) => {
    try {
        const { name, category } = req.query;

        const data = (name || category)
            ? await restaurantService.searchRestaurants({ name, category })
            : await restaurantService.getAllRestaurants();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await restaurantService.getRestaurantById(id);
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getSummary = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        const summary = await restaurantService.getRestaurantsSummary(categories, 5);
        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};