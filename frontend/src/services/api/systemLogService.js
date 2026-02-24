import api from '../../config/axiosConfig';

const systemLogService = {
    getLogs: async (cursor = null, limit = 20, level = null) => {
        try {
            const response = await api.get('/Logs', {
                params: {
                    cursor: cursor,
                    limit: limit,
                    level: level
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching system logs:", error);
            throw error;
        }
    },
};

export default systemLogService;