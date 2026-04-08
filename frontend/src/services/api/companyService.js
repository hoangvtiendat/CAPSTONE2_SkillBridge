import api from '../../config/axiosConfig';

const companyService = {
    getFeed: async (params = {}) => {
        try {
            const { page = 0, limit = 6, keyword, categoryId } = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', limit);
            if (keyword) queryParams.append('keyword', keyword);
            if (categoryId) queryParams.append('categoryId', categoryId);

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

    getCompanyFeedPending: async (page = 0, limit = 10) => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            const response = await api.get(`/companies/feedPending?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy danh sách công ty chờ duyệt:", error);
            throw error;
        }
    },

    responseCompanyPending: async (companyId, status) => {
        try {
            const queryParams = new URLSearchParams();
            if (status) queryParams.append('status', status);

            const response = await api.patch(`/companies/feedPending/${companyId}/response?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi phản hồi yêu cầu công ty", error);
            throw error;
        }
    },

    getMembers: async () => {
        try {
            const response = await api.get('/company-member/getMember');
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy danh sách nhân viên:", error);
            throw error;
        }
    },

    getMemberPending: async () => {
        try {
            const response = await api.get('/company-member/memberPending');
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy danh sách thành viên chờ duyệt:", error);
            throw error;
        }
    },

    respondJoinRequest: async (requestId, status) => {
        try {
            const response = await api.post(`/companies/join-request/${requestId}`, {
                status: status
            });
            return response.data;
        } catch (error) {
            console.error("Lỗi xử lý yêu cầu:", error);
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
            params: { taxCode }
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
    },

    deactivate: (id, data) => {
        return api.post(`/companies/${id}/deactivate`, data);
    },

    reactivate: (id) => {
        return api.post(`/companies/${id}/reactivate`);
    }
};

export default companyService;
