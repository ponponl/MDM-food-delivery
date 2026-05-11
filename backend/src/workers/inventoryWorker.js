import cron from 'node-cron';
import Menu from '../modules/menu/menuModel.js';
import redisClient from '../config/redis.js';

cron.schedule('*/5 * * * *', async () => {
  const keys = await redisClient.keys('stock:*');
  
  for (const key of keys) {
    const itemId = key.split(':')[2];
    const currentStock = await redisClient.get(key);

    await Menu.updateOne(
      { _id: itemId },
      { $set: { stock: parseInt(currentStock) } }
    );
  }
  console.log("Đã đồng bộ tồn kho từ Redis về MongoDB");
});