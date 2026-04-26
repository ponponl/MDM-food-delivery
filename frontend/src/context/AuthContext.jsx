import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentMerchant, logout } from '../services/authService';
import userApi from '../api/userApi';
import { useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const location = useLocation();
    const isMerchantRoute = location.pathname.startsWith('/merchant');

    const extractUserPayload = (response) => {
        const payload = response?.data ?? response;
        return payload?.data?.user || payload?.user || payload || null;
    };

    const fetchMerchantMe = async () => {
        try {
            return await fetchCurrentMerchant();
        } catch (error) {
            if (error?.response?.status === 401) {
                return null;
            }
            throw error;
        }
    };

    const fetchUserMe = async () => {
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

    const { data: merchantUser, isLoading: isMerchantLoading } = useQuery({
        queryKey: ['merchantMe'],
        queryFn: fetchMerchantMe,
        retry: false,
        enabled: isMerchantRoute
    });

    const { data: clientUser, isLoading: isClientLoading } = useQuery({
        queryKey: ['userMe'],
        queryFn: fetchUserMe,
        retry: false,
        enabled: !isMerchantRoute
    });

    const user = useMemo(() => {
        return isMerchantRoute ? merchantUser : clientUser;
    }, [clientUser, isMerchantRoute, merchantUser]);

    const isLoading = isMerchantRoute ? isMerchantLoading : isClientLoading;

    const loginUser = (userData) => {
        const isMerchant = userData?.role === 'merchant' || isMerchantRoute;
        queryClient.setQueryData(isMerchant ? ['merchantMe'] : ['userMe'], userData || null);
    };

    const logoutUser = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Lỗi khi gọi API logout:", error);
        } finally {
            queryClient.setQueryData(['merchantMe'], null);
            queryClient.setQueryData(['userMe'], null);
            queryClient.removeQueries({ queryKey: ['merchantMe'] });
            queryClient.removeQueries({ queryKey: ['userMe'] });
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
