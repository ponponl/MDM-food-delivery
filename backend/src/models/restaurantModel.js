import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    name: String,
    address: String,
    phone: String,
    menu: [
        {
            name: String,
            price: Number,
            description: String,
            images: [String],
            category: String
        }
    ],
    type: String,
    images: [String]
});

export default mongoose.model('Restaurant', restaurantSchema, 'restaurant');