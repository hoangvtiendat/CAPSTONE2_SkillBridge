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
