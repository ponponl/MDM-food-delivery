import axiosClient from './axiosClient';

const orderApi = {
  previewOrder: ({
    userExternalId,
    restaurantId,
    itemKeys = null
  }) =>
    axiosClient.post('/orders/preview', {
      userExternalId,
      restaurantId,
      itemKeys
    }),
  createOrder: ({
    userExternalId,
    restaurantId,
    deliveryAddress,
    note = null,
    paymentMethod = 'cash',
    itemKeys = null
  }) =>
    axiosClient.post('/orders', {
      userExternalId,
      restaurantId,
      deliveryAddress,
      note,
      paymentMethod,
      itemKeys
    }),
  getOrderDetail: (orderExternalId) =>
    axiosClient.get(`/orders/${orderExternalId}`),
  getUserOrders: (userExternalId, status = null, limit = 20, offset = 0) => {
    const params = new URLSearchParams({
      userExternalId,
      limit,
      offset
    });
    if (status) params.append('status', status);
    return axiosClient.get(`/orders?${params.toString()}`);
  },
  getRestaurantOrders: (restaurantId, status = null, limit = 20, offset = 0) => {
    const params = new URLSearchParams({
      restaurantId,
      limit,
      offset
    });
    if (status) params.append('status', status);
    return axiosClient.get(`/orders/restaurant?${params.toString()}`);
  },
  confirmOrder: (orderExternalId, estimatedPrepTime = null) =>
    axiosClient.patch(`/orders/${orderExternalId}/confirm`, {
      estimatedPrepTime
    }),
  startDelivery: (orderExternalId, { driverId = null, estimatedDeliveryTime = null } = {}) =>
    axiosClient.patch(`/orders/${orderExternalId}/deliver`, {
      driverId,
      estimatedDeliveryTime
    }),
  completeOrder: (orderExternalId, { completedBy = null, signature = null } = {}) =>
    axiosClient.patch(`/orders/${orderExternalId}/complete`, {
      completedBy,
      signature
    }),
  cancelOrder: (orderExternalId, { reason = null, cancelledBy = null } = {}) =>
    axiosClient.patch(`/orders/${orderExternalId}/cancel`, {
      reason,
      cancelledBy
    }),
  getRevenueStats: (params) => {
    return axiosClient.get('/orders/stats/revenue', { params: params });
  }
};

export default orderApi;
