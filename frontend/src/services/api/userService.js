import api from '../../config/axiosConfig';

const userService = {
    getProfile: async () => {
        try {
            const response = await api.get('/users/me');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateProfile: async (profileData) => {
        try {
            const response = await api.patch('/users/me', profileData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default userService;
