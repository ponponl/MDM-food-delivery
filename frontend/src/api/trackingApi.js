import axiosClient from './axiosClient';

export const trackingApi = {
    getOrderRoute: async (driverId, orderId) => {
        return await axiosClient.get(`/tracking/${driverId}`, {
            params: { order_id: orderId }
        });
    }
};