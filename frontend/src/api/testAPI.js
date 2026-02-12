import axiosClient from './axiosClient';

const testAPI = {
  getSystemStatus: () => {
    const url = '/test'; 
    return axiosClient.get(url);
  },
};

export default testAPI;