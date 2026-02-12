import api from '../../config/axiosConfig';

const companyService = {
    getFeed: async (params = {}) => {
        try {
            const { page = 1, limit = 10, search } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', limit);
            if (search) queryParams.append('search', search);

            const response = await api.get(`/companies/feed?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default companyService;
