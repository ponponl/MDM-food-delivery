import mongoose from 'mongoose';
import logger from '../config/logger.js';
import Restaurant from '../models/restaurantModel.js';

const normalizeMenuItem = (menuItem, restaurantId) => {
  if (!menuItem) return null;

  const stock = Number.isFinite(menuItem.stock) ? menuItem.stock : 0;
  const price = typeof menuItem.price === 'number' ? menuItem.price : 0;
  const available = menuItem.available === true;

  return {
    itemId: menuItem.itemId?.toString?.() ?? menuItem.itemId,
    name: menuItem.name,
    price,
    description: menuItem.description,
    images: menuItem.images || [],
    category: menuItem.category,
    available,
    stock,
    restaurantId: restaurantId?.toString?.() ?? restaurantId
  };
};

export class MenuRepository {
  async findMenuItemById(itemId) {
    const itemObjectId = mongoose.Types.ObjectId.isValid(itemId)
      ? new mongoose.Types.ObjectId(itemId)
      : null;

    if (!itemObjectId) {
      logger.warn(`Invalid menu item id: ${itemId}`);
      return null;
    }

    const result = await Restaurant.findOne(
      { 'menu.itemId': itemObjectId },
      { 'menu.$': 1, _id: 1 }
    ).lean();

    if (!result?.menu?.length) {
      logger.warn(`Menu item not found: ${itemId}`);
      return null;
    }

    return normalizeMenuItem(result.menu[0], result._id);
  }

  async findMenuItemsByIds(itemIds) {
    const items = {};

    const objectIds = itemIds
      .map(itemId => (mongoose.Types.ObjectId.isValid(itemId)
        ? new mongoose.Types.ObjectId(itemId)
        : null))
      .filter(Boolean);

    if (objectIds.length > 0) {
      const results = await Restaurant.aggregate([
        { $match: { 'menu.itemId': { $in: objectIds } } },
        { $unwind: '$menu' },
        { $match: { 'menu.itemId': { $in: objectIds } } },
        { $project: { _id: 1, menu: 1 } }
      ]);

      for (const result of results) {
        const normalized = normalizeMenuItem(result.menu, result._id);
        if (normalized?.itemId) {
          items[normalized.itemId] = normalized;
        }
      }
    }

    for (const itemId of itemIds) {
      if (!items[itemId]) {
        logger.warn(`Menu item not found: ${itemId}`);
        items[itemId] = {
          itemId: itemId.toString(),
          name: `Item ${itemId}`,
          price: 0,
          available: false,
          stock: 0,
          restaurantId: null
        };
      }
    }

    return items;
  }

  async findRestaurantMenu(restaurantId) {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      logger.warn(`Invalid restaurant id: ${restaurantId}`);
      return [];
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) {
      logger.warn(`Restaurant not found: ${restaurantId}`);
      return [];
    }

    return (restaurant.menu || []).map(item => normalizeMenuItem(item, restaurant._id));
  }
}
