import mongoose from "mongoose";
import menuItemSchema from './menuModel.js';

const restaurantSchema = new mongoose.Schema({
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
    menu: [menuItemSchema],
    openTime: String,
    closeTime: String
}, {
    toJSON: {
        versionKey: false,
        transform: (_doc, ret) => {
            delete ret._id;
            return ret;
        }
    },
    toObject: {
        versionKey: false,
        transform: (_doc, ret) => {
            delete ret._id;
            return ret;
        }
    }
});

export default mongoose.model('Restaurant', restaurantSchema, 'restaurant');