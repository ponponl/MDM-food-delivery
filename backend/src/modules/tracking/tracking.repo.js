import { cassandraClient } from '../../config/cassandra.js'; 

export class TrackingRepository {
    async getTrackingHistoryFromDB(driverId, date) {
        const query = `
            SELECT timestamp, lat, lng, order_id 
            FROM foodly_tracking.location_history 
            WHERE driverId = ? AND date = ?
        `;
        const result = await cassandraClient.execute(query, [driverId, date], { prepare: true });
        
        return result.rows; 
    };

    async getTrackingHistoryByOrder(orderId) {
        const query = `
            SELECT timestamp, lat, lng, driver_id 
            FROM foodly_tracking.location_by_order 
            WHERE order_id = ? 
        `;
        
        const result = await cassandraClient.execute(
            query, 
            [orderId], 
            { prepare: true }
        );
        
        return result.rows; 
    };

    async saveLocationToDB({ driverId, lat, lng, order_id }) {
        const query = `
            INSERT INTO foodly_tracking.location_by_order 
            (order_id, timestamp, driver_id, lat, lng) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const timestamp = new Date(); 
        
        return await cassandraClient.execute(
            query, 
            [order_id, timestamp, driverId, lat, lng], 
            { prepare: true }
        );
    };
}