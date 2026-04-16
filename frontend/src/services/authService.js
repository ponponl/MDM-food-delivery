import axios from 'axios';

const API_BaseURL = import.meta.env.VITE_SERVER_BASE_API_URL;

const api = axios.create({
    baseURL: API_BaseURL,
    withCredentials: true
});

const register = async (userData) => {
    try {
        const response = await api.post('/users/register', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Lỗi mạng');
    }
};

const login = async (credentials) => {
    try {
        const response = await api.post('/users/login', credentials);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Lỗi mạng');
    }
};

const logout = async () => {
    try {
        await api.post('/users/logout');
    } catch (error) {
        console.error("Lỗi đăng xuất", error);
    }
};

const fetchCurrentUser = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data.data?.user || response.data.user;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const updateProfile = async (profileData) => {
    try {
        const response = await api.put('/users/profile', profileData);
        return response.data.data?.user || response.data.user;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const updateAddresses = async (addresses) => {
    try {
        const response = await api.put('/users/addresses', { addresses });
        return response.data.data?.user || response.data.user;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const registerMerchant = async (merchantData) => {
    try {
        const response = await api.post('/auth/merchant/register', merchantData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Lỗi mạng');
    }
};

const loginMerchant = async (credentials) => {
    try {
        const response = await api.post('/auth/merchant/login', credentials);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Lỗi mạng');
    }
};

export { register, login, logout, fetchCurrentUser, updateProfile, updateAddresses, registerMerchant, loginMerchant };