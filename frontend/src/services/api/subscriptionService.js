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
    },
    createSubscriptionOfCompany: async (data, token) => {
        try{
            const response = await api.post("/subscription/company/create", data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        }catch (error) {
            console.error('Error creating subscription for company:', error);
            throw error;
        }
    },
    deleteSubscriptionOfCompany: async (id, token) => {
        try {
            const response = await api.delete(`/subscription/company/delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting subscription of company:', error);
            throw error;
        }
    },
    listSubcriftionOfCompany: async (token) => {
        try {
            const response = await api.get('/subscription/company/list', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;       
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
};
export default subscriptionService; 