import { messageQueue } from '../../config/queue.js';
import pgPool from '../../config/postgres.js';
import { OrderRepository } from './orderRepo.js';
import {RestaurantRepository} from '../restaurant/restaurantRepo.js';
import { getRestaurantMenu } from '../menu/menuService.js';

const restaurantRepo = new RestaurantRepository();
const orderRepository = new OrderRepository();

export const generateOrders = async (req, res, next) => {
    try {
      const { restaurantId, numberOfOrders = 50, daysInPast = 30 } = req.body;

      const restaurant = await restaurantRepo.findByPublicId(restaurantId, { includeMenu: false });
      if (!restaurant) {
        return res.status(400).json({ 
          message: 'The restaurant does not exist or it does not have any items' 
        });
      }

      const menu = await getRestaurantMenu(restaurantId);
      if (!menu || menu.length === 0) {
        return res.status(400).json({ 
          message: 'The restaurant does not exist or it does not have any items' 
        });
      }
      let totalGeneratedRevenue = 0;

      for (let i = 0; i < numberOfOrders; i++) {
        const randomDaysAgo = Math.floor(Math.random() * daysInPast);
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - randomDaysAgo);
        pastDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        const maxItems = Math.min(5, menu.length);

        const numItems = Math.floor(Math.random() * maxItems) + 1;
        const orderItems = [];
        let orderTotalPrice = 0;

        for (let j = 0; j < numItems; j++) {
          const randomDish = menu[Math.floor(Math.random() * menu.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;

          orderItems.push({
            name: randomDish.name,
            price: randomDish.price,
            quantity: quantity,
            product_id: randomDish.itemId || randomDish._id || randomDish.id 
          });

          orderTotalPrice += (randomDish.price * quantity);
        }

        const validUserIds = [1, 2, 3, 5, 8, 12, 13];

        const randomUserId = validUserIds[Math.floor(Math.random() * validUserIds.length)];

        const newOrder = await orderRepository.createOrder(pgPool, {
          userId: randomUserId,
          restaurantId: restaurantId,
          restaurantName: restaurant.name,
          restaurantImageUrl: restaurant.image || restaurant.imageUrl,
          totalPrice: orderTotalPrice,
          totalItems: numItems,
          status: 'completed',
          deliveryAddress: { receiver: 'Bot', phone: '0000000000', address: 'System Test' }
        });

        await orderRepository.createOrderItems(pgPool, newOrder.id, orderItems);

        messageQueue.emit('ORDER_FINISHED', {
          orderId: newOrder.externalid,
          restaurantId: restaurantId, 
          totalPrice: orderTotalPrice,     
          timestamp: pastDate.toISOString()
        });

        totalGeneratedRevenue += orderTotalPrice;
      }

      res.status(200).json({
        status: 'success',
        count: numberOfOrders,
        totalRevenue: totalGeneratedRevenue,
        message: `Succeed inserting order data for ${restaurant.name}`
      });

    } catch (error) {
      next(error);
    }
};