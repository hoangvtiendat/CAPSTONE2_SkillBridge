import userService from '../services/api/userService';
import authService from '../services/api/authService';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize user from localStorage if available
    const [user, setUser] = useState(() => {
        // Đọc từ key 'user' vì đây là object chứa cả token và info
        const savedUser = localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('accessToken') || null;
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        // Chỉ hiện loading nếu chưa có dữ liệu user (tránh loop khi sync ngầm)
        if (!user) setLoading(true);
        try {
            const response = await userService.getProfile();
            if (response && response.result) {
                const userStr = localStorage.getItem('user');
                const existingUser = userStr ? JSON.parse(userStr) : {};
                const updatedUser = { ...existingUser, ...response.result };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);

            if (err.response && err.response.status === 401) {
                setUser(null);
                setToken(null);
            }

            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const login = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        if (userData.accessToken) {
            setToken(userData.accessToken);
            localStorage.setItem('accessToken', userData.accessToken);
            fetchProfile();
        } else if (userData.token) {
            setToken(userData.token);
            localStorage.setItem('accessToken', userData.token);
            fetchProfile();
        }
    }, [fetchProfile]);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout API failed:', error);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token');

            window.location.href = '/login';
        }
    }, []);

    const updateUser = useCallback(async (newData) => {
        setLoading(true);
        try {
            const response = await userService.updateProfile(newData);
            if (response && response.result) {
                const updatedUser = response.result;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser;
            }
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, fetchProfile, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
