import axiosClient from './axiosClient';

const cartApi = {
    addItem: ({ userExternalId, itemId, quantity = 1, restaurantPublicId, options = [], note = null }) =>
        axiosClient.post('/cart/items', {
            userExternalId,
            itemId,
            quantity,
            restaurantPublicId,
            options,
            note
        }),
    getCart: ({ userExternalId } = {}) =>
        axiosClient.get('/cart', userExternalId ? { params: { userExternalId } } : undefined),
    getCartByRestaurant: ({ restaurantPublicId, userExternalId } = {}) =>
        axiosClient.get(`/cart/restaurants/${restaurantPublicId}`,
            userExternalId ? { params: { userExternalId } } : undefined
        ),
    updateItemQuantity: ({ userExternalId, itemId, quantity, restaurantPublicId, options = [], note = null }) =>
        axiosClient.put('/cart/items', {
            userExternalId,
            itemId,
            quantity,
            restaurantPublicId,
            options,
            note
        }),
    removeItem: ({ userExternalId, itemId, restaurantPublicId, options = [], itemKey = null }) =>
        axiosClient.delete('/cart/items', {
            data: {
                userExternalId,
                itemId,
                restaurantPublicId,
                options,
                itemKey
            }
        }),
    clearCart: ({ userExternalId }) =>
        axiosClient.delete('/cart', userExternalId ? { params: { userExternalId } } : undefined)
};

export default cartApi;
