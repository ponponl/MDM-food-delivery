import cron from 'node-cron';
import MenuInventoryDaily from '../modules/inventory/menuInventoryDailyModel.js';
import { getBusinessDate } from '../modules/inventory/inventoryService.js';
import { setRemainingInventoryCache } from '../modules/inventory/inventoryCache.js';

cron.schedule('*/5 * * * *', async () => {
  const businessDate = getBusinessDate();
  const inventories = await MenuInventoryDaily.find({ date: businessDate }).lean();

  for (const inventory of inventories) {
    const totalQuantity = Number(inventory.totalQuantity) || 0;
    const soldQuantity = Number(inventory.soldQuantity) || 0;
    const remainingQuantity = Math.max(0, totalQuantity - soldQuantity);

    await setRemainingInventoryCache({
      restaurantId: inventory.restaurantId,
      businessDate: inventory.date,
      menuItemId: inventory.menuItemId,
      remainingQuantity,
      totalQuantity,
      soldQuantity
    });
  }
});