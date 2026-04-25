import axiosClient from './axiosClient';

const menuApi = {
    addDish: (formData) =>
        axiosClient.post('/menu/add', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),
    updateDish: (itemId, formData) =>
        axiosClient.put(`/menu/update/${itemId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),
    deleteDish: (itemId, publicId) => 
        axiosClient.delete(`/menu/delete/${itemId}`, {
            data: { publicId }
        }),
    getMenuByRestaurant: (restaurantId) =>
        axiosClient.get(`/menu/restaurant/${restaurantId}`),
    getMenuItem: (itemId) =>
        axiosClient.get(`/menu/item/${itemId}`)
};

export default menuApi;