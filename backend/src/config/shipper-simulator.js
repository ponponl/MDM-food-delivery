import 'dotenv/config';
import pgPool from './postgres.js'; 
import { cassandraClient } from './cassandra.js';
import { OrderRepository } from '../modules/order/orderRepo.js';
import { RestaurantRepository } from '../modules/restaurant/restaurantRepo.js'; 
import connectMongo from './mongodb.js';

const orderRepository = new OrderRepository();
const restaurantRepository = new RestaurantRepository(); 

const STEP_RATIO = 0.05; 

const completedOrderCache = new Set();

async function triggerCompleteOrder(orderExternalId) {
    try {
        const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/orders/${orderExternalId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                completedBy: 'shipper_system',
                signature: 'auto_simulated'
            })
        });
        const result = await response.json();
        if (result.status === 'success') {
            console.log(`Đã cập nhật trạng thái đơn ${orderExternalId} thành COMPLETED.`);
            completedOrderCache.delete(orderExternalId);
        }
    } catch (error) {
        console.error(`Lỗi khi gọi API Complete cho đơn ${orderExternalId}:`, error.message);
        completedOrderCache.delete(orderExternalId);
    }
}

async function simulateRoute() {
    try {
        const deliverOrder = await orderRepository.getActiveDeliveriesForSimulation();

        if (deliverOrder.rows.length === 0) {
            console.log("=== TẤT CẢ ĐƠN HÀNG ĐÃ HOÀN THÀNH. DỪNG SIMULATOR... ===");
            process.exit(0); 
        }

        const now = new Date();

        for (const order of deliverOrder.rows) {
            const externalid = order.externalid || order.externalId;

            if (completedOrderCache.has(externalid)) {
                continue; 
            }

            const dest_lat = Number(order.dest_lat);
            const dest_lng = Number(order.dest_lng);
            const restaurantid = order.restaurantid || order.restaurantId;
            const driver_id = order.driver_id || order.driverid || order.driverId;

            if (!driver_id || dest_lat == null || dest_lng == null) continue;

            const restaurant = await restaurantRepository.findByPublicId(restaurantid, { includeMenu: false });
            if (!restaurant?.address?.location?.coordinates) continue;

            const start_lng = restaurant.address.location.coordinates[0];
            const start_lat = restaurant.address.location.coordinates[1];

            const lastLoc = await cassandraClient.execute(
                "SELECT lat, lng FROM foodly_tracking.location_by_order WHERE order_id = ? LIMIT 1",
                [externalid],
                { prepare: true }
            );

            let curLat = start_lat;
            let curLng = start_lng;

            if (lastLoc.rows.length > 0) {
                curLat = lastLoc.rows[0].lat;
                curLng = lastLoc.rows[0].lng;
            }

            const dLat = dest_lat - curLat;
            const dLng = dest_lng - curLng;
            
            const ARRIVAL_THRESHOLD = 0.0001;

            if (Math.abs(dLat) > ARRIVAL_THRESHOLD || Math.abs(dLng) > ARRIVAL_THRESHOLD) {
                curLat += dLat * STEP_RATIO;
                curLng += dLng * STEP_RATIO;

                await cassandraClient.execute(
                    "INSERT INTO foodly_tracking.location_by_order (order_id, timestamp, driver_id, lat, lng) VALUES (?, ?, ?, ?, ?)",
                    [externalid, now, driver_id, curLat, curLng],
                    { prepare: true }
                );
                console.log(`[Đơn ${externalid}]: Shipper ${driver_id} đang thẳng tiến: (${curLat.toFixed(4)}, ${curLng.toFixed(4)}) -> Đích (${dest_lat.toFixed(4)})`);
            } else {
                console.log(`[Đơn ${externalid}]: Shipper ${driver_id} ĐÃ CẬP BẾN!`);

                completedOrderCache.add(externalid);

                triggerCompleteOrder(externalid);

                await cassandraClient.execute(
                    "INSERT INTO foodly_tracking.location_by_order (order_id, timestamp, driver_id, lat, lng) VALUES (?, ?, ?, ?, ?)",
                    [externalid, now, driver_id, dest_lat, dest_lng],
                    { prepare: true }
                );
            }
        }
    } catch (err) {
        console.error("Lỗi giả lập lộ trình:", err);
    }
}

async function startSimulator() {
    try {
        console.log("Đang khởi tạo các kết nối Database...");
        
        await connectMongo(); 
        console.log("MongoDB connected for Simulator");

        console.log("=== GIẢ LẬP GIAO HÀNG SẴN SÀNG ===");
        
        await simulateRoute(); 
        
        setInterval(simulateRoute, 3000);

    } catch (error) {
        console.error("Lỗi khởi động Simulator:", error);
        process.exit(1);
    }
}

startSimulator();