import axios from 'axios';

const API_BaseURL = import.meta.env.VITE_SERVER_BASE_API_URL;

const api = axios.create({
    baseURL: API_BaseURL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const register = async (userData) => {
    try {
        const response = await api.post('/users/register', userData);
        const token = response.data.accessToken || response.data.data?.accessToken;
        const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;
        if (token) {
            localStorage.setItem('accessToken', token);
        }
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Lỗi mạng');
    }
};

const login = async (credentials) => {
    try {
        const response = await api.post('/users/login', credentials);
        const token = response.data.accessToken || response.data.data?.accessToken;
        const refreshToken = response.data.refreshToken || response.data.data?.refreshToken;
        if (token) {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('user', JSON.stringify(response.data.data?.user || response.data.user));
        }
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error('Lỗi mạng');
    }
};

const logout = async () => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        await api.post('/users/logout', { refreshToken });
    } catch (error) {
        console.error("Lỗi đăng xuất", error);
    } finally {
        localStorage.clear();
        window.location.href = '/auth';
    }
};

const fetchCurrentUser = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data.user;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export { register, login, logout, fetchCurrentUser };