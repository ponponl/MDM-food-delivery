import axiosClient from "./axiosClient";

const reviewApi = {
    getReviewsByItemId: (itemId) => {
        const url = `/reviews/${itemId}`;
        return axiosClient.get(url);
    },
    getReviewsByRestaurantId: (restaurantId) => {
        const url = `/reviews/restaurant/${restaurantId}`;
        return axiosClient.get(url);
    },
    createReviews: (payload) => {
        const url = `/reviews/`;
        return axiosClient.post(url, payload);
    }
};

export default reviewApi;
