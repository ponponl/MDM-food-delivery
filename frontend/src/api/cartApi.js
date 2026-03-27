import axiosClient from './axiosClient';

const cartApi = {
    addItem: ({ itemId, quantity = 1, restaurantPublicId, options = [], note = null }) =>
        axiosClient.post('/cart/items', {
            itemId,
            quantity,
            restaurantPublicId,
            options,
            note
        }),
    getCart: () => axiosClient.get('/cart'),
    getCartByRestaurant: ({ restaurantPublicId }) =>
        axiosClient.get(`/cart/restaurants/${restaurantPublicId}`),
    updateItemQuantity: ({ itemId, quantity, restaurantPublicId, options = [], note = null }) =>
        axiosClient.put('/cart/items', {
            itemId,
            quantity,
            restaurantPublicId,
            options,
            note
        }),
    removeItem: ({ itemId, restaurantPublicId, options = [], itemKey = null }) =>
        axiosClient.delete('/cart/items', {
            data: {
                itemId,
                restaurantPublicId,
                options,
                itemKey
            }
        }),
    clearCart: () => axiosClient.delete('/cart')
};

export default cartApi;
