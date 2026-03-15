import React, { createContext, useContext, useState, useEffect } from 'react';
import { logout, fetchCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');

            if (accessToken) {
                try {
                    const user = await fetchCurrentUser(accessToken);
                    setUser(user);
                } catch (error) {
                    console.error("Token invalid or expired:", error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('accessToken');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const loginUser = (userData, token) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logoutUser = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Lỗi khi gọi API logout:", error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
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
