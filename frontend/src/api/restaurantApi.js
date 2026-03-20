import axiosClient from "./axiosClient";

const restaurantApi = {
    getAll: () => {
        const url = '/restaurants';
        return axiosClient.get(url);
    }
};

export default restaurantApi;