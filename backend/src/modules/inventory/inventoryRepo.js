import MenuInventoryDaily from './menuInventoryDailyModel.js';

export class InventoryRepository {
  async findDailyInventory({ menuItemId, restaurantId, date }) {
    return await MenuInventoryDaily.findOne({
      menuItemId,
      restaurantId,
      date
    }).lean();
  }

  async findDailyInventories({ restaurantId, date, menuItemIds }) {
    if (!Array.isArray(menuItemIds) || menuItemIds.length === 0) {
      return [];
    }

    return await MenuInventoryDaily.find({
      restaurantId,
      date,
      menuItemId: { $in: menuItemIds }
    }).lean();
  }

  async ensureDailyInventory({ menuItemId, restaurantId, date, totalQuantity }) {
    return await MenuInventoryDaily.findOneAndUpdate(
      { menuItemId, restaurantId, date },
      {
        $setOnInsert: {
          totalQuantity,
          soldQuantity: 0
        }
      },
      { new: true, upsert: true }
    ).lean();
  }

  async reserveStockAtomic({ menuItemId, restaurantId, date, quantity }) {
    const result = await MenuInventoryDaily.updateOne(
      {
        menuItemId,
        restaurantId,
        date,
        $expr: {
          $lte: [
            '$soldQuantity',
            { $subtract: ['$totalQuantity', quantity] }
          ]
        }
      },
      {
        $inc: {
          soldQuantity: quantity
        }
      }
    );

    return result.modifiedCount === 1;
  }

  async rollbackStockAtomic({ menuItemId, restaurantId, date, quantity }) {
    const result = await MenuInventoryDaily.updateOne(
      {
        menuItemId,
        restaurantId,
        date,
        $expr: {
          $gte: ['$soldQuantity', quantity]
        }
      },
      {
        $inc: {
          soldQuantity: -quantity
        }
      }
    );

    return result.modifiedCount === 1;
  }
}
