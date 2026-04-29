import { v2 as cloudinary } from 'cloudinary';
import logger from '../../config/logger.js';
import { MenuRepository } from './menuRepo.js';
import { invalidateRestaurantCache } from '../restaurant/restaurantCache.js';
import {
  attachInventoryToMenuItems,
  getMenuItemWithInventory,
  getBusinessDate,
  resolveRestaurantTimezone
} from '../inventory/inventoryService.js';
import { RestaurantRepository } from '../restaurant/restaurantRepo.js';

const menuRepo = new MenuRepository();
const restaurantRepo = new RestaurantRepository();

const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1].split('.')[0];
  const folder = parts[parts.length - 2];
  return `${folder}/${fileName}`;
};

export const getMenuItem = async (itemId) => {
  const menuItem = await menuRepo.findMenuItemById(itemId);
  if (!menuItem) return null;
  return await getMenuItemWithInventory(menuItem);
};

export const getRestaurantMenu = async (publicId) => {
  const menu = await menuRepo.findRestaurantMenu(publicId);
  if (!menu || menu.length === 0) return [];

  const restaurant = await restaurantRepo.findByPublicId(publicId, { includeMenu: false });
  const timezone = resolveRestaurantTimezone(restaurant);
  const businessDate = getBusinessDate(timezone);

  return await attachInventoryToMenuItems({
    menuItems: menu,
    restaurantId: restaurant?._id || menu?.[0]?.restaurantId,
    businessDate
  });
};

export const addDish = async (publicId, body, file) => {
  const imageUrl = file ? file.path : null;
  const dishData = {
    ...body,
    price: Number(body.price),
    stock: Number(body.stock),
    images: imageUrl ? [imageUrl] : [],
    available: body.available === 'true' || true
  };
  const updated = await menuRepo.addMenuItem(publicId, dishData);
  await invalidateRestaurantCache(publicId, { includeMenu: true });
  return updated;
};

export const updateDish = async (publicId, itemId, body, file) => {
  const imageUrl = file ? file.path : null;
  if (imageUrl) {
    const currentDish = await menuRepo.findMenuItem(publicId, itemId);
    if (currentDish?.images?.length > 0) {
      const deletePromises = currentDish.images.map(img => cloudinary.uploader.destroy(getPublicIdFromUrl(img)));
      await Promise.all(deletePromises);
    }
  }
  const updateData = { ...body, price: Number(body.price), stock: Number(body.stock), available: body.available === 'true' };
  if (imageUrl) updateData.images = [imageUrl];

  const updated = await menuRepo.updateMenuItem(publicId, itemId, updateData);
  await invalidateRestaurantCache(publicId, { includeMenu: true });
  return updated;
};

export const deleteDish = async (publicId, itemId) => {
  const dish = await menuRepo.findMenuItem(publicId, itemId);
  if (dish?.images?.length > 0) {
    const deletePromises = dish.images.map(img => cloudinary.uploader.destroy(getPublicIdFromUrl(img)));
    await Promise.all(deletePromises);
  }
  const updated = await menuRepo.deleteMenuItem(publicId, itemId);
  await invalidateRestaurantCache(publicId, { includeMenu: true });
  return updated;
};

// Các hàm khác giữ nguyên logic cũ
export const getMenuItems = async (ids) => await menuRepo.findMenuItemsByIds(ids);
export const isItemAvailable = async (id) => {
  const item = await getMenuItem(id);
  return item ? item.available : false;
};