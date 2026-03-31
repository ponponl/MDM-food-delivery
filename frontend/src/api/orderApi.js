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
    })
};

export default orderApi;
