// src/workers/startWorker.js
import { messageQueue } from '../config/queue.js';
import { processOrderCompleted } from './aggregatorWorker.js';

console.log('---- Worker đã khởi động ----');

messageQueue.on('ORDER_FINISHED', async (data) => {
    console.log(`[Worker] Nhận được đơn hàng hoàn tất từ quán ${data.restaurantId}`);
    
    try {
        await processOrderCompleted(data); 
        console.log(`[Worker] Đã cộng ${data.totalPrice}đ vào Cassandra thành công!`);
    } catch (error) {
        console.error(`[Worker] Lỗi cộng doanh thu:`, error);
    }
});