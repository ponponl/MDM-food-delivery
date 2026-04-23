import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logout } from '../services/authService';
import userApi from '../api/userApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();

    const fetchMe = async () => {
        try {
            const response = await userApi.getMe();
            const payload = response?.data ?? response;
            const userData = payload?.data?.user || payload?.user || payload || null;
            return userData;
        } catch (error) {
            if (error?.response?.status === 401) {
                return null;
            }
            throw error;
        }
    };

    const { data: user, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: fetchMe,
        retry: false
    });

    const loginUser = (userData) => {
        queryClient.setQueryData(['me'], userData || null);
    };

    const logoutUser = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Lỗi khi gọi API logout:", error);
        } finally {
            queryClient.setQueryData(['me'], null);
            queryClient.removeQueries({ queryKey: ['me'] });
        }
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading: isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
};
