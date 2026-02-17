import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_API_URL || 'http://localhost:3000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export default axiosClient;