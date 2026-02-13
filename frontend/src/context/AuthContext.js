import userService from '../services/api/userService';
import React, { createContext, useContext, useState, useEffect } from 'react';

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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfile = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        setLoading(true);
        try {
            const response = await userService.getProfile();
            if (response && response.result) {
                setUser(response.result);
                localStorage.setItem('user', JSON.stringify(response.result));
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError(err);
            // Optional: logout if fetch fails with 401?
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        if (userData.accessToken) {
            localStorage.setItem('accessToken', userData.accessToken);
            fetchProfile();
        } else if (userData.token) {
            localStorage.setItem('accessToken', userData.token);
            fetchProfile();
        }
        // If token is not in userData but expected to be in localStorage already or handled otherwise
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');
    };

    const updateUser = async (newData) => {
        setLoading(true);
        try {
            const response = await userService.updateProfile(newData);
            if (response && response.result) {
                const updatedUser = response.result;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage with new profile
                return updatedUser;
            }
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, fetchProfile, loading, error }}>
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
