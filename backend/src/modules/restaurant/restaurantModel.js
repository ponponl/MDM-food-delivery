import mongoose from "mongoose";
import menuItemSchema from '../menu/menuModel.js';

const restaurantSchema = new mongoose.Schema({
    publicId: String,
    accountId: Number,
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
            coordinates: {
                type: [Number],
                validate: {
                    validator: function(v) {
                        return v.length === 2;
                    },
                    message: 'Tọa độ phải bao gồm [kinh độ, vĩ độ]'
                }
            }
        }
    },
    phone: String,
    images: [String],
    menu: [menuItemSchema],
    openTime: String,
    closeTime: String,
    totalReview: Number,
    avgRating: Number
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

restaurantSchema.index({ "address.location": "2dsphere" });

export default mongoose.model('Restaurant', restaurantSchema, 'restaurant');