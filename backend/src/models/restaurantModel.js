import mongoose from "mongoose";
import menuItemSchema from './menuModel.js';

const restaurantSchema = new mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    slug: String,
    publicId: String,
    name: String,
    type: String,
    address: {
        street: String,
        ward: String,
        district: String,
        city: String,
        country: String,
        full: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    },
    phone: String,
    images: [String],
    menu: [menuItemSchema]
});

export default mongoose.model('Restaurant', restaurantSchema, 'restaurant');