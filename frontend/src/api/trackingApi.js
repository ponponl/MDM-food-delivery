import axiosClient from './axiosClient';

export const trackingApi = {
    getOrderRoute: async (orderId) => {
        return await axiosClient.get(`/tracking/${orderId}`);
    },

    getLatestLocation: async (orderId) => {
        return await axiosClient.get(`/tracking/${orderId}/latest`);
    }
};