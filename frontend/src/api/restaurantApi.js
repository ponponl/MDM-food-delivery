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
    getBulk: (ids = []) => {
        const url = '/restaurants/bulk';
        const payload = Array.isArray(ids) ? ids : [ids];
        const normalizedIds = payload.filter(Boolean);
        return axiosClient.get(url, { params: { ids: normalizedIds.join(',') } });
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
    },
    getNearest: (lng, lat, distance = 5000) => {
        const url = '/restaurants/nearest';
        return axiosClient.get(url, { params: { lng, lat, distance } });
    },
    updateInfo: (formData) => {
        const url = '/restaurants/update';
        return axiosClient.put(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

export default restaurantApi;