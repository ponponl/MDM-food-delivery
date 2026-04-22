import moment from 'moment';
import { cassandraClient } from '../config/cassandra.js';

export const processOrderCompleted = async (orderEvent) => {
  const { restaurantId, totalPrice, timestamp } = orderEvent;

  const dateObj = moment(timestamp);
  
  const timePartitionDay = dateObj.format('YYYY-MM'); 
  const timeValueDay = dateObj.format('YYYY-MM-DD');  
  
  const timePartitionMonth = dateObj.format('YYYY');  
  const timeValueMonth = dateObj.format('YYYY-MM');   
  
  const timePartitionYear = 'ALL';
  const timeValueYear = dateObj.format('YYYY');       

  const queryDay = `
    UPDATE foodly_tracking.restaurant_revenue_stats
    SET total_orders = total_orders + 1, total_revenue = total_revenue + ?
    WHERE restaurant_id = ? AND granularity = 'DAY' AND time_partition = ? AND time_value = ?;
  `;

  const queryMonth = `
    UPDATE foodly_tracking.restaurant_revenue_stats
    SET total_orders = total_orders + 1, total_revenue = total_revenue + ?
    WHERE restaurant_id = ? AND granularity = 'MONTH' AND time_partition = ? AND time_value = ?;
  `;

  const queryYear = `
    UPDATE foodly_tracking.restaurant_revenue_stats
    SET total_orders = total_orders + 1, total_revenue = total_revenue + ?
    WHERE restaurant_id = ? AND granularity = 'YEAR' AND time_partition = ? AND time_value = ?;
  `;

  try {
    await Promise.all([
      cassandraClient.execute(queryDay, [totalPrice, restaurantId, timePartitionDay, timeValueDay], { prepare: true }),
      cassandraClient.execute(queryMonth, [totalPrice, restaurantId, timePartitionMonth, timeValueMonth], { prepare: true }),
      cassandraClient.execute(queryYear, [totalPrice, restaurantId, timePartitionYear, timeValueYear], { prepare: true })
    ]);
    
    console.log(`[Worker] Đã cộng ${totalPrice}đ vào thống kê cho quán ${restaurantId}`);
    
  } catch (error) {
    console.error('[Worker] Lỗi khi update Cassandra:', error);
    throw error; 
  }
};