import { TrackingRepository } from './tracking.repo.js';
import { formatTrackingData } from './tracking.model.js';

const trackingRepo = new TrackingRepository();

export const fetchTrackingHistory = async (orderId) => {
    if (!orderId) {
        throw new Error('orderId is required');
    }

    try {
        const rawData = await trackingRepo.getTrackingHistoryByOrder(orderId);

        if (!rawData || rawData.length === 0) {
            console.warn(`[TrackingService] Không tìm thấy lịch sử tọa độ cho Order: ${orderId}`);
        }

        const formattedRoute = rawData.map(row => formatTrackingData(row));

        const currentDriverId = formattedRoute.length > 0 ? formattedRoute[0].driverId : null;

        return {
            order_id: orderId,
            driver_id: currentDriverId, 
            total_points: formattedRoute.length,
            route: formattedRoute
        };
    } catch (error) {
        console.error("Error in fetchTrackingHistory service:", error);
        throw error;
    }
};