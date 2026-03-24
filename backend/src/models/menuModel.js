import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    itemId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    description: String,
    images: [String],
    category: String,
    available: { type: Boolean, default: true },
    stock: { type: Number, default: 0 }
  },
  { _id: false }
);

export default menuItemSchema;
