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
    },

    lookupTaxCode: async (taxCode) => {
        try {
            const response = await api.get('/companies/taxLook', {
                params: { taxCode }
            });
            return response.data;
        } catch (error) {
            console.error("Lỗi tra cứu MST:", error);
            throw error;
        }
    },

    checkTaxCode: (taxCode) => {
        return api.get(`/companies/taxcode`, {
            params: {taxCode}
        });
    },

    registerIdentification: (formData) => {
        return api.post(`/companies/identification`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    requestToJoin: (companyId) => {
        return api.post(`/companies/${companyId}/join-request`);
    },

    getCompanyById: (id) => {
        return api.get(`/companies/${id}`);
    }
};

export default companyService;
