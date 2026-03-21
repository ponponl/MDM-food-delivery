import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    name: String,
    address: String,
    phone: String,
    menu: [
        {
            itemId: mongoose.Schema.Types.ObjectId,
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