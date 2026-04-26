import { TrackingRepository } from './tracking.repo.js';
import { formatTrackingData } from './tracking.model.js';

const trackingRepo = new TrackingRepository();

export const fetchTrackingHistory = async (driverId, orderId, inputDate) => {
    if (!driverId || !orderId) {
        throw new Error('driverId and orderId required');
    }

    const queryDate = inputDate || new Date().toISOString().split('T')[0];

    try {
        const rawData = await trackingRepo.getTrackingHistoryByOrder(driverId, queryDate, orderId);

        if (!rawData || rawData.length === 0) {
            console.warn(`[TrackingService] Không tìm thấy tọa độ cho Driver: ${driverId} vào ngày ${queryDate}`);
        }

        const formattedRoute = rawData.map(row => formatTrackingData(row));

        return {
            driver_id: driverId,
            order_id: orderId,
            date: queryDate,
            total_points: formattedRoute.length,
            route: formattedRoute
        };
    } catch (error) {
        console.error("Error in fetchTrackingHistory service:", error);
        throw error;
    }
};