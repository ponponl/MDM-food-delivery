import { CustomizationRepository } from './customizationGroupsRepo.js';
import { customizationCache } from './customiztionGroupsCache.js';
import { MenuRepository } from '../menu/menuRepo.js';
import { invalidateRestaurantCache } from '../restaurant/restaurantCache.js'; 

const customRepo = new CustomizationRepository();
const menuRepo = new MenuRepository();

export const getGroupsByRestaurant = async (publicId) => {
  const cached = await customizationCache.getGroups(publicId);
  if (cached) return cached;

  const groups = await customRepo.findAllByRestaurant(publicId);
  
  if (groups.length > 0) {
    await customizationCache.setGroups(publicId, groups);
  }
  return groups;
};

export const addGroup = async (publicId, data) => {
  const newGroup = await customRepo.create({ ...data, restaurantPublicId: publicId });
  await customizationCache.invalidateGroups(publicId);
  return newGroup;
};

// export const updateGroup = async (publicId, groupId, data) => {
//   const updated = await customRepo.update(groupId, data);
//   if (updated) {
//     await customizationCache.invalidateGroups(publicId);
//   }
//   return updated;
// };

export const deleteGroup = async (publicId, groupId) => {
  const deleted = await customRepo.delete(groupId);
  
  if (deleted) {
    await menuRepo.pullCustomizationByGroupId(groupId);
    await customizationCache.invalidateGroups(publicId);
    const affectedPublicIds = await menuRepo.findAffectedRestaurantsByGroupId(groupId);
    for (const pId of affectedPublicIds) {
      await invalidateRestaurantCache(pId, { includeMenu: true });
    }
  }
  return deleted;
};

export const updateGroup = async (publicId, groupId, data) => {
  const updated = await customRepo.update(groupId, data);
  if (!updated) return null;

  await menuRepo.updateManyByGroupId(groupId, {
    groupName: updated.groupName,
    isRequired: updated.isRequired,
    options: updated.options
  });
  await customizationCache.invalidateGroups(publicId);
  const affectedPublicIds = await menuRepo.findAffectedRestaurantsByGroupId(groupId);
  for (const pId of affectedPublicIds) {
    await invalidateRestaurantCache(pId, { includeMenu: true });
  }
  return updated;
};