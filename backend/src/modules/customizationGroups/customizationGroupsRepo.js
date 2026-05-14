import CustomizationGroup from './customizationGroupsModel.js';

export class CustomizationRepository {
  async create(data) {
    return await CustomizationGroup.create(data);
  }

  async findAllByRestaurant(publicId) {
    return await CustomizationGroup.find({ restaurantPublicId: publicId }).lean();
  }

  async findById(groupId) {
    return await CustomizationGroup.findById(groupId).lean();
  }

  async update(groupId, updateData) {
    return await CustomizationGroup.findByIdAndUpdate(
      groupId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  async delete(groupId) {
    return await CustomizationGroup.findByIdAndDelete(groupId);
  }
}