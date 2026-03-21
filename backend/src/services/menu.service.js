import logger from '../config/logger.js';

const MENU_MOCK = {
  "12": {
    itemId: "12",
    name: "Phở bò",
    price: 50000,
    restaurantId: "res_22",
    available: true,
    description: "Phở bò tái nạm truyền thống",
    image: "https://example.com/pho-bo.jpg"
  },
  "45": {
    itemId: "45",
    name: "Cơm gà",
    price: 35000,
    restaurantId: "res_22",
    available: true,
    description: "Cơm gà xối mỡ",
    image: "https://example.com/com-ga.jpg"
  },
  "67": {
    itemId: "67",
    name: "Bún chả",
    price: 40000,
    restaurantId: "res_22",
    available: false,
    description: "Bún chả Hà Nội",
    image: "https://example.com/bun-cha.jpg"
  },
  "89": {
    itemId: "89",
    name: "Bánh mì",
    price: 20000,
    restaurantId: "res_22",
    available: true,
    description: "Bánh mì thịt",
    image: "https://example.com/banh-mi.jpg"
  },
  "101": {
    itemId: "101",
    name: "Hủ tiếu",
    price: 45000,
    restaurantId: "res_22",
    available: true,
    description: "Hủ tiếu Nam Vang",
    image: "https://example.com/hu-tieu.jpg"
  }
};

export const getMenuItem = async (itemId) => {
  try {
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 10));

    const item = MENU_MOCK[itemId.toString()];
    
    if (!item) {
      logger.warn(`Menu item not found: ${itemId}`);
      return null;
    }

    return item;

  } catch (error) {
    logger.error(`Error getting menu item ${itemId}: ${error.message}`);
    throw error;
  }
};

export const getMenuItems = async (itemIds) => {
  try {
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 20));

    const items = {};

    for (const itemId of itemIds) {
      const item = MENU_MOCK[itemId.toString()];
      if (item) {
        items[itemId] = item;
      } else {
        logger.warn(`Menu item not found: ${itemId}`);
        // Return mock item for missing IDs (for development)
        items[itemId] = {
          itemId: itemId.toString(),
          name: `Item ${itemId}`,
          price: 50000,
          restaurantId: "res_22",
          available: true
        };
      }
    }

    return items;

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
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 30));

    const items = Object.values(MENU_MOCK).filter(
      item => item.restaurantId === restaurantId
    );

    return items;

  } catch (error) {
    logger.error(`Error getting restaurant menu: ${error.message}`);
    throw error;
  }
};

/**
 * TODO: Replace these with actual API integrations
 * 
 * Example real implementation:
 * 
 * export const getMenuItem = async (itemId) => {
 *   const response = await fetch(`${MENU_API_URL}/items/${itemId}`);
 *   if (!response.ok) throw new Error('Item not found');
 *   return response.json();
 * };
 * 
 * Or with database:
 * 
 * export const getMenuItem = async (itemId) => {
 *   const result = await menuDb.query(
 *     'SELECT * FROM menu_items WHERE id = $1',
 *     [itemId]
 *   );
 *   return result.rows[0] || null;
 * };
 */
