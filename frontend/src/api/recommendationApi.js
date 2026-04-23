import axiosClient from './axiosClient';

const recommendationApi = {
  getRecommendations: () => axiosClient.get('/recommendations')
};

export default recommendationApi;
