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
  }
};

export default orderApi;
