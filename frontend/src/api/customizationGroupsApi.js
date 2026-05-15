import axiosClient from './axiosClient';

const customizationApi = {
  getGroupsByRestaurant: (publicId) => {
    return axiosClient.get(`/customization/${publicId}`);
  },

  create: (data) => {
    return axiosClient.post('/customization', data);
  },

  update: (groupId, data) => {
    return axiosClient.put(`/customization/${groupId}`, data);
  },

  delete: (groupId, publicId) => {
    return axiosClient.delete(`/customization/${groupId}`, {
      params: { publicId }
    });
  }
};

export default customizationApi;