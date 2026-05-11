import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    },
    restaurantPublicId: String,
    restaurantName: String,
    name: String,
    price: Number,
    category: String,
    available: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
    description: String,
    images: [String],
    totalReview: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
    toObject: { versionKey: false }
  }
);

menuSchema.index({ restaurantId: 1 });
menuSchema.index({ restaurantPublicId: 1 });
menuSchema.index({ name: 'text', category: 'text' });

export default mongoose.model('Menu', menuSchema, 'menu');
