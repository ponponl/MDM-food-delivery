import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    iconKey: { type: String, required: true },
    order: { type: Number, default: 0 },
    displayName: { type: String, required: true }
});

export default mongoose.model('Category', categorySchema, 'category');
