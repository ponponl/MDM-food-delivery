import axiosClient from "./axiosClient";

const restaurantApi = {
    getAll: (params = {}) => {
        const url = '/restaurants';
        return axiosClient.get(url, { params });
    },
    getById: (publicId) => {
        const url = `/restaurants/${publicId}`;
        return axiosClient.get(url);
    },
    getSummary: () => {
        const url = '/restaurants/summary';
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