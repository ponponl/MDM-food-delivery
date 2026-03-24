import axiosClient from './axiosClient';

const cartApi = {
    addItem: ({ userExternalId, itemId, quantity = 1 }) =>
        axiosClient.post('/cart/items', { userExternalId, itemId, quantity }),
    getCart: ({ userExternalId }) =>
        axiosClient.get('/cart', { params: { userExternalId } }),
    updateItemQuantity: ({ userExternalId, itemId, quantity }) =>
        axiosClient.put('/cart/items', { userExternalId, itemId, quantity }),
    removeItem: ({ userExternalId, itemId }) =>
        axiosClient.delete('/cart/items', { data: { userExternalId, itemId } }),
    clearCart: ({ userExternalId }) =>
        axiosClient.delete('/cart', { params: { userExternalId } })
};

export default cartApi;
