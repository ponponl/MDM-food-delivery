import Restaurant from '../models/restaurantModel.js'

export class RestaurantRepository {
    async findAll() {
        return await Restaurant.find();
    }
}