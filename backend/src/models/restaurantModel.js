import mongoose from "mongoose";
import menuItemSchema from './menuModel.js';

const restaurantSchema = new mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    name: String,
    address: String,
    phone: String,
    menu: [menuItemSchema],
    type: String,
    images: [String]
});

export default mongoose.model('Restaurant', restaurantSchema, 'restaurant');