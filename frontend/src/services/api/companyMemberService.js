import api  from "../../config/axiosConfig";

const companyMemberService = {
    getCompanyMembersRole: async(token) => {
        try {
            const response = await api.get('/company-member/getRole', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
export default companyMemberService;