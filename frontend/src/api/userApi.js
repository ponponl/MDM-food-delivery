import axiosClient from './axiosClient';

const userApi = {
  getMe: () => axiosClient.get('/users/me')
};

export default userApi;
