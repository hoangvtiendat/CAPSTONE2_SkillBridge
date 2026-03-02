import api from '../../config/axiosConfig';

const companyService = {
    getFeed: async (params = {}) => {
        try {
            const { page = 0, limit = 6, search } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', limit);
            if (search) queryParams.append('search', search);

            const response = await api.get(`/companies/feed?${queryParams.toString()}`);
            const result = response.data.result;
            return {
                companies: result.companies || [],
                totalPages: result.totalPages || 0,
                totalElements: result.totalElements || 0,
                currentPage: result.currentPage || 0
            };
        } catch (error) {
            throw error;
        }
    }
};

export default companyService;
