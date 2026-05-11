import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    targetType: {
      type: String,
      enum: ['restaurant', 'menu'],
      required: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      default: null
    },
    orderId: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, default: '' },
    imageUrls: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
  },
  {
    toJSON: { versionKey: false },
    toObject: { versionKey: false }
  }
);

reviewSchema.index({ restaurantId: 1, targetType: 1 });
reviewSchema.index({ menuId: 1, targetType: 1 });
reviewSchema.index({ orderId: 1, userId: 1 });

export default mongoose.model('Review', reviewSchema, 'review');
