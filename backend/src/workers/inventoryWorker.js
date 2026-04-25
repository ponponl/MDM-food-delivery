import cron from 'node-cron';
import Restaurant from '../modules/restaurant/restaurantModel.js';
import redisClient from '../config/redis.js';

cron.schedule('*/5 * * * *', async () => {
  const keys = await redisClient.keys('stock:*');
  
  for (const key of keys) {
    const itemId = key.split(':')[2];
    const currentStock = await redisClient.get(key);

    await Restaurant.updateOne(
      { "menu._id": itemId },
      { $set: { "menu.$.stock": parseInt(currentStock) } }
    );
  }
  console.log("Đã đồng bộ tồn kho từ Redis về MongoDB");
});