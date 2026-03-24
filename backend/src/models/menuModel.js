import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  images: [String],
  category: String,
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 0 }
});

export default menuItemSchema;
