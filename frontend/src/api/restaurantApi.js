import axiosClient from "./axiosClient";

const restaurantApi = {
    getAll: (params = {}) => {
        const url = '/restaurants';
        return axiosClient.get(url, { params });
    },
    getById: (id) => {
        const url = `/restaurants/${id}`;
        return axiosClient.get(url);
    },
    searchByName: (name) => {
        const url = '/restaurants';
        return axiosClient.get(url, { params: { name } });
    },
    searchByCategory: (category) => {
        const url = '/restaurants';
        return axiosClient.get(url, { params: { category } });
    }
};

export default restaurantApi;