import axiosClient from "./axiosClient";

const reviewApi = {
    getReviewsByItemId: (itemId) => {
        const url = `/reviews/${itemId}`;
        return axiosClient.get(url);
    },
    getReviewsByRestaurantId: (restaurantId) => {
        const url = `/reviews/restaurant/${restaurantId}`;
        return axiosClient.get(url);
    }
};

export default reviewApi;
