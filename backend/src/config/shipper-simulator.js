import 'dotenv/config';
import pgPool from './postgres.js'; 
import { cassandraClient } from './cassandra.js';
import { OrderRepository } from '../modules/order/orderRepo.js';
import { RestaurantRepository } from '../modules/restaurant/restaurantRepo.js'; 
import connectMongo from './mongodb.js';

const orderRepository = new OrderRepository();
const restaurantRepository = new RestaurantRepository(); 

const STEP_RATIO = 0.05; 

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
        }
    } catch (error) {
        console.error(`Lỗi khi gọi API Complete cho đơn ${orderExternalId}:`, error.message);
    }
}

async function simulateRoute() {
    try {
        const deliverOrder = await orderRepository.getActiveDeliveriesForSimulation();

        if (deliverOrder.rows.length === 0) {
            console.log("=== TẤT CẢ ĐƠN HÀNG ĐÃ HOÀN THÀNH. DỪNG SIMULATOR... ===");
            process.exit(0); 
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        for (const order of deliverOrder.rows) {
            const externalid = order.externalid || order.externalId;
            const dest_lat = order.dest_lat;
            const dest_lng = order.dest_lng;
            const restaurantid = order.restaurantid || order.restaurantId;
            
            const driver_id = order.driver_id || order.driverid || order.driverId;

            if (!driver_id) {
                console.log(`Đơn ${externalid} không tìm thấy mã tài xế`);
                continue;
            }

            if (dest_lat == null || dest_lng == null) {
                console.log(`Đơn ${externalid} thiếu tọa độ khách hàng trong Postgres`);
                continue;
            }

            const restaurant = await restaurantRepository.findByPublicId(restaurantid, { includeMenu: false });

            if (!restaurant || !restaurant.address?.location?.coordinates) {
                console.log(`Không tìm thấy tọa độ quán trong MongoDB`);
                continue; 
            }

            const start_lng = restaurant.address.location.coordinates[0];
            const start_lat = restaurant.address.location.coordinates[1];

            const lastLoc = await cassandraClient.execute(
                "SELECT lat, lng FROM foodly_tracking.location_history WHERE driver_id = ? AND date = ? LIMIT 1",
                [driver_id, today],
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
            
            if (Math.abs(dLat) > 0.0001 || Math.abs(dLng) > 0.0001) {
                curLat += dLat * STEP_RATIO;
                curLng += dLng * STEP_RATIO;
                
                curLat += (Math.random() - 0.5) * 0.0001;
                curLng += (Math.random() - 0.5) * 0.0001;

                await cassandraClient.execute(
                    "INSERT INTO foodly_tracking.location_history (driver_id, date, timestamp, lat, lng, order_id) VALUES (?, ?, ?, ?, ?, ?)",
                    [driver_id, today, now, curLat, curLng, externalid],
                    { prepare: true }
                );
                console.log(`Shipper ${driver_id} đang giao: Quán (${start_lat.toFixed(4)}, ${start_lng.toFixed(4)}) -> Khách (${dest_lat.toFixed(4)}, ${dest_lng.toFixed(4)})`);
            } else {
                console.log(`🏁 Shipper ${driver_id} ĐÃ ĐẾN NƠI! Đang chốt đơn...`);
                
                triggerCompleteOrder(externalid);

                await cassandraClient.execute(
                    "INSERT INTO foodly_tracking.location_history (driver_id, date, timestamp, lat, lng, order_id) VALUES (?, ?, ?, ?, ?, ?)",
                    [driver_id, today, now, dest_lat, dest_lng, externalid],
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
