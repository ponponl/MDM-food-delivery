import axiosClient from './axiosClient';

const cartApi = {
    addItem: ({ userExternalId, itemId, quantity = 1 }) =>
        axiosClient.post('/cart/items', { userExternalId, itemId, quantity })
};

export default cartApi;
