import mongoose from 'mongoose';
import logger from '../../config/logger.js';
import Restaurant from '../restaurant/restaurantModel.js';

const normalizeMenuItem = (menuItem, restaurantId, restaurantName) => {
  if (!menuItem) return null;
  const stock = Number.isFinite(menuItem.stock) ? menuItem.stock : 0;
  const price = typeof menuItem.price === 'number' ? menuItem.price : 0;
  const available = menuItem.available === true;

  return {
    itemId: menuItem._id?.toString?.() ?? menuItem._id,
    name: menuItem.name,
    price,
    description: menuItem.description,
    images: menuItem.images || [],
    category: menuItem.category,
    available,
    stock,
    restaurantId: restaurantId?.toString?.() ?? restaurantId,
    restaurantName: restaurantName || null
  };
};

export class MenuRepository {
  async findMenuItemById(itemId) {
    const itemObjectId = mongoose.Types.ObjectId.isValid(itemId) ? new mongoose.Types.ObjectId(itemId) : null;
    if (!itemObjectId) return null;

    const result = await Restaurant.findOne(
      { 'menu._id': itemObjectId },
      { 'menu.$': 1, _id: 1, name: 1 }
    ).lean();

    if (!result?.menu?.length) return null;
    return normalizeMenuItem(result.menu[0], result._id, result.name);
  }

  async findMenuItemsByIds(itemIds) {
    const items = {};
    const objectIds = itemIds.map(id => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null)).filter(Boolean);

    if (objectIds.length > 0) {
      const results = await Restaurant.aggregate([
        { $match: { 'menu._id': { $in: objectIds } } },
        { $unwind: '$menu' },
        { $match: { 'menu._id': { $in: objectIds } } },
        { $project: { _id: 1, name: 1, menu: 1 } }
      ]);
      for (const res of results) {
        const normalized = normalizeMenuItem(res.menu, res._id, res.name);
        if (normalized?.itemId) items[normalized.itemId] = normalized;
      }
    }
    return items;
  }

  async findMenuItem(publicId, itemId) {
    const restaurant = await Restaurant.findOne({ publicId, "menu._id": itemId }, { "menu.$": 1 }).lean();
    return restaurant?.menu?.[0] || null;
  }

  async findRestaurantMenu(publicId) {
    const restaurant = await Restaurant.findOne({ publicId }).lean();
    if (!restaurant) return [];
    return (restaurant.menu || []).map(item => normalizeMenuItem(item, restaurant._id, restaurant.name));
  }

  async addMenuItem(publicId, itemData) {
    return await Restaurant.findOneAndUpdate({ publicId }, { $push: { menu: itemData } }, { new: true, runValidators: true });
  }

  async updateMenuItem(publicId, itemId, updateData) {
    return await Restaurant.findOneAndUpdate(
      { publicId, "menu._id": itemId },
      { $set: { 
          "menu.$.name": updateData.name, "menu.$.price": updateData.price,
          "menu.$.description": updateData.description, "menu.$.category": updateData.category,
          "menu.$.stock": updateData.stock, "menu.$.available": updateData.available,
          ...(updateData.images && { "menu.$.images": updateData.images })
      }},
      { new: true }
    );
  }

  async deleteMenuItem(publicId, itemId) {
    return await Restaurant.findOneAndUpdate({ publicId }, { $pull: { menu: { _id: itemId } } }, { new: true });
  }
}