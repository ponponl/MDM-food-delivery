import { getTrackingHistoryByOrder } from './tracking.repo.js';
import { formatTrackingData } from './tracking.model.js';

export const fetchTrackingHistory = async (driverId, orderId, inputDate) => {
    const queryDate = inputDate || new Date().toISOString().split('T')[0];

    if (!orderId) throw new Error('ORDER_ID_REQUIRED');

    const rawData = await getTrackingHistoryByOrder(driverId, queryDate, orderId);

    const formattedRoute = rawData.map(row => formatTrackingData(row));

    return {
        driver_id: driverId,
        order_id: orderId,
        date: queryDate,
        total_points: formattedRoute.length,
        route: formattedRoute
    };
};