import mongoose from 'mongoose';

const menuInventoryDailySchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true
    },
    totalQuantity: {
      type: Number,
      required: true
    },
    soldQuantity: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

menuInventoryDailySchema.index(
  { menuItemId: 1, restaurantId: 1, date: 1 },
  { unique: true }
);

export default mongoose.model(
  'MenuInventoryDaily',
  menuInventoryDailySchema,
  'menu_inventory_daily'
);
