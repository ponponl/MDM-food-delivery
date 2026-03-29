import axiosClient from './axiosClient';

const orderApi = {
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
