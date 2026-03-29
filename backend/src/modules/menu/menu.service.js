import logger from '../../config/logger.js';
import { MenuRepository } from './menuRepo.js';

const menuRepository = new MenuRepository();

export const getMenuItem = async (itemId) => {
  try {
    return await menuRepository.findMenuItemById(itemId);

  } catch (error) {
    logger.error(`Error getting menu item ${itemId}: ${error.message}`);
    throw error;
  }
};

export const getMenuItems = async (itemIds) => {
  try {
    return await menuRepository.findMenuItemsByIds(itemIds);

  } catch (error) {
    logger.error(`Error getting menu items: ${error.message}`);
    throw error;
  }
};

export const isItemAvailable = async (itemId) => {
  try {
    const item = await getMenuItem(itemId);
    return item ? item.available : false;
  } catch (error) {
    logger.error(`Error checking item availability: ${error.message}`);
    return false;
  }
};

export const getRestaurantMenu = async (restaurantId) => {
  try {
    return await menuRepository.findRestaurantMenu(restaurantId);

  } catch (error) {
    logger.error(`Error getting restaurant menu: ${error.message}`);
    throw error;
  }
};