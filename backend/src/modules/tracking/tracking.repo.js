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

    async getTrackingHistoryByOrder(driverId, date, orderId) {
        const query = `
            SELECT timestamp, lat, lng 
            FROM foodly_tracking.location_history 
            WHERE driver_id = ? 
            AND date = ? 
            AND order_id = ? 
            ALLOW FILTERING
        `;
        
        const result = await cassandraClient.execute(
            query, 
            [driverId, date, orderId], 
            { prepare: true }
        );
        
        return result.rows; 
    };

    async saveLocationToDB({ driverId, lat, lng, order_id }) {
        const query = `
            INSERT INTO foodly_tracking.location_history 
            (driverId, date, timestamp, lat, lng, order_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const date = new Date().toISOString().split('T')[0];
        const timestamp = new Date();
        
        return await cassandraClient.execute(query, [driverId, date, timestamp, lat, lng, order_id], { prepare: true });
    };
}