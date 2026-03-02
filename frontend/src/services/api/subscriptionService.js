import api from '../../config/axiosConfig';
 
const subscriptionService = {
    getlistSubscription: async () => {
        try {
            const response = await api.get('/subscription/list');
            return response.data;
        }catch (error) {
                throw error;
        }
    },
    getDetailSubscription: async (id) => {
        try {
            const response = await api.get(`/subscription/${id}`);
            return response.data;
        }catch (error) {
                throw error;
        }
    },
    UpdateSubcription: async (id, data, token) => {
        try {
            const response = await api.put(`/subscription/update/${id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        }catch (error) {
                throw error;
        }
    }
    
}
export default subscriptionService; 