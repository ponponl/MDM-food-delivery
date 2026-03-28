import axiosClient from "./axiosClient";

const searchApi = {
    searchAll: (searchTerm, limit = 10) => {
        const url = '/search';
        return axiosClient.get(url, {
            params: {
                q: searchTerm,
                limit: limit
            }
        });
    }
};

export default searchApi;