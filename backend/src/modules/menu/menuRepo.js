import mongoose from 'mongoose';
import Menu from './menuModel.js';

const normalizeMenuItem = (menuItem) => {
  if (!menuItem) return null;
  const stock = Number.isFinite(menuItem.stock) ? menuItem.stock : 0;
  const price = typeof menuItem.price === 'number' ? menuItem.price : 0;
  const available = menuItem.available === true;
  const totalReview = Number.isFinite(menuItem.totalReview)
    ? menuItem.totalReview
    : (Number.isFinite(menuItem.totalRatings) ? menuItem.totalRatings : 0);
  const ratingCount = Number.isFinite(menuItem.ratingCount)
    ? menuItem.ratingCount
    : (Number.isFinite(menuItem.countRatings) ? menuItem.countRatings : 0);
  const rating = ratingCount > 0 ? totalReview / ratingCount : 0;

  return {
    itemId: menuItem._id?.toString?.() ?? menuItem._id,
    name: menuItem.name,
    price,
    description: menuItem.description,
    images: menuItem.images || [],
    category: menuItem.category,
    available,
    stock,
    totalReview,
    ratingCount,
    rating,
    restaurantId: menuItem.restaurantId?.toString?.() ?? menuItem.restaurantId,
    restaurantPublicId: menuItem.restaurantPublicId || null,
    restaurantName: menuItem.restaurantName || null,
    customization: menuItem.customization || []
  };
};

export class MenuRepository {
  async findMenuItemById(itemId) {
    const itemObjectId = mongoose.Types.ObjectId.isValid(itemId) ? new mongoose.Types.ObjectId(itemId) : null;
    if (!itemObjectId) return null;

    const result = await Menu.findById(itemObjectId).lean();
    if (!result) return null;
    return normalizeMenuItem(result);
  }

  async findMenuItemsByIds(itemIds) {
    const items = {};
    const objectIds = itemIds.map(id => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null)).filter(Boolean);

    if (objectIds.length > 0) {
      const results = await Menu.find({ _id: { $in: objectIds } }).lean();
      for (const res of results) {
        const normalized = normalizeMenuItem(res);
        if (normalized?.itemId) items[normalized.itemId] = normalized;
      }
    }
    return items;
  }

  async findMenuItem(publicId, itemId) {
    return await Menu.findOne({ _id: itemId, restaurantPublicId: publicId }).lean();
  }

  async findRestaurantMenu(publicId) {
    const items = await Menu.find({ restaurantPublicId: publicId }).lean();
    if (!items || items.length === 0) return [];
    return items.map(item => normalizeMenuItem(item));
  }

  async addMenuItem(itemData) {
    return await Menu.create(itemData);
  }

  async updateMenuItem(publicId, itemId, updateData) {
    return await Menu.findOneAndUpdate(
      { _id: itemId, restaurantPublicId: publicId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  async deleteMenuItem(publicId, itemId) {
    return await Menu.findOneAndDelete({ _id: itemId, restaurantPublicId: publicId });
  }

  async incrementMenuRating(itemId, rating) {
    const itemObjectId = mongoose.Types.ObjectId.isValid(itemId)
      ? new mongoose.Types.ObjectId(itemId)
      : null;
    if (!itemObjectId) return null;
    const ratingValue = Number(rating);
    if (!Number.isFinite(ratingValue)) return null;
    return await Menu.updateOne(
      { _id: itemObjectId },
      { $inc: { totalReview: ratingValue, ratingCount: 1 } }
    );
  }

  async updateManyByGroupId(groupId, groupData) {
    return await Menu.updateMany(
      { "customization.groupId": groupId },
      { 
        $set: { 
          "customization.$.groupName": groupData.groupName,
          "customization.$.isRequired": groupData.isRequired,
          "customization.$.options": groupData.options
        } 
      }
    );
  }

  async findAffectedRestaurantsByGroupId(groupId) {
    const results = await Menu.distinct('restaurantPublicId', { "customization.groupId": groupId });
    return results;
  }

  async pullCustomizationByGroupId(groupId) {
    return await Menu.updateMany(
      {},
      { 
        $pull: { 
          customization: { groupId: groupId } 
        } 
      }
    );
  }
}