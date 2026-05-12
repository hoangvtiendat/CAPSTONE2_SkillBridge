import api from '../../config/axiosConfig';

const applicationService = {
    // Lấy danh sách ứng viên theo Job ID
    getApplicationsByJob: async (jobId) => {
        const response = await api.get(`/applications/job/${jobId}`);
        return response.data;
    },

    /** So sánh hai đơn ứng tuyển cùng một tin (Gemini) — applicationIdA là "ứng viên thứ nhất" trong kết quả FIRST/SECOND */
    compareCandidatesForJob: async (jobId, { applicationIdA, applicationIdB }) => {
        const response = await api.post(`/applications/job/${jobId}/compare`, {
            applicationIdA,
            applicationIdB,
        });
        return response.data;
    },

    // Lấy chi tiết 1 đơn ứng tuyển
    getApplicationDetail: async (id) => {
        const response = await api.get(`/applications/${id}`);
        return response.data;
    },

    // Phản hồi ứng viên (Thay đổi trạng thái)
    respondToApplication: async (id, payload) => {
        // payload ở đây sẽ là 1 object dạng: { status: 'REJECTED', reason: 'Lý do...' }
        const response = await api.post(`/applications/${id}/respond`, payload);
        return response.data;
    },

    // Lấy danh sách ứng viên theo công ty
    getApplicationsByCompany: async (companyId) => {
        const response = await api.get(`/applications/company/${companyId}`);
        return response.data;
    },

    // Xóa đơn ứng tuyển
    deleteApplication: async (id) => {
        const response = await api.delete(`/applications/${id}`);
        return response.data;
    },

    // check TRUE/FALSE nếu đã ứng tuyển vào JD nào đó
    CheckApplied: async (jobId) => {
        try {
            const response = await api.get(`/applications/JD/Check-apply/${jobId}`);
            return response.data;
        } catch (error) {
            console.error('Error checking application status:', error);
            throw error;
        }
    }
};

export default applicationService;