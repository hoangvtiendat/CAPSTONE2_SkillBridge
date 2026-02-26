import api from '../../config/axiosConfig';

const companyService = {
    getFeed: async (params = {}) => {
        try {
            const {page = 1, limit = 10, search} = params;
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

    // 1. Kiểm tra mã số thuế
    // checkTaxCode: (taxCode) => {
    //     return api.get(`/identity/companies/taxcode`, {params: {taxCode}});
    // },
    //
    // // 2. Đăng ký định danh doanh nghiệp mới
    // registerIdentification: (companyData) => {
    //     return api.post(`/identity/companies/identification`, companyData);
    // },
    //
    // // 3. Gửi yêu cầu tham gia công ty đã tồn tại
    // requestToJoin: (companyId) => {
    //     return api.post(`/identity/companies/${companyId}/join-request`);
    // }


    checkTaxCode: (taxCode) => {
        return api.get(`/companies/taxcode`, {
            params: {taxCode}
        });
    },

    /**
     * 3. Đăng ký định danh doanh nghiệp mới (Identification Step 2)
     * API: POST /identity/companies/identification
     * Body: { name, taxcode, businessLicenseUrl, imageUrl, description, address, websiteUrl }
     */
    registerIdentification: (companyData) => {
        return api.post(`/companies/identification`, companyData);
    },

    /**
     * 4. Gửi yêu cầu gia nhập vào một công ty đã tồn tại (Identification Step 3)
     * API: POST /identity/companies/{companyId}/join-request
     */
    requestToJoin: (companyId) => {
        return api.post(`/companies/${companyId}/join-request`);
    },

    /**
     * 5. Lấy chi tiết thông tin một công ty (Dùng cho trang Detail)
     */
    getCompanyById: (id) => {
        return api.get(`/companies/${id}`);
    }

};

export default companyService;
