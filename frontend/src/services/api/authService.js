import api from '../../config/axiosConfig';

const authService = {
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    register: async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyOtp: async (email, otpCode) => {
        try {
            
            const response = await api.post('/auth/login/verify-otp', { email, otp: otpCode });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    toggleTwoFactor: async (isEnabled) => {
        try {
            const response = await api.patch('/auth/me/2fa', { isEnabled });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    logout: async () => {
        try {
            const response = await api.post('/auth/logout');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default authService;
