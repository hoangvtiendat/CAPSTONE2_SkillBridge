import api from '../../config/axiosConfig';

const jdService = {
    getMyJd_of_Company: async (userId, token) => {
        try {
            const response = await api.get(`/jobs/my-company?userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching JD:', error);
            throw error;
        }
    },
    getDetailJd: async (id) => {
        try{
            const response = await api.get(`jobs/my-company/${id}`);
            return response.data;
        }catch (error) {
            console.error('Error fetching JD details:', error);
            throw error;
        }
    },
    createJd: async (jdData) => {
        try {
            const response = await api.post('/jobs/postJD', jdData);
            return response.data;
        } catch (error) {
            console.error('Error creating JD:', error);
            throw error;
        }
    },
    updateJd: async (id, jdData) => {
        try {
            const response = await api.put(`/jobs/updateJD/${id}`, jdData);
            return response.data;
        }
        catch (error) {
            console.error('Error updating JD:', error);
            throw error;
        }
    }
}
export default jdService;