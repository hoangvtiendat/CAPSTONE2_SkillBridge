import api from '../../config/axiosConfig';

const interviewService = {
    createBatchSlots: async (data) => {
        try {
            const response = await api.post('/interviews/batch-slots', data);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi tạo danh sách khung giờ:", error);
            throw error;
        }
    },
    updateSlot: async (slotId, data) => {
        try {
            const response = await api.put(`/interviews/slots/${slotId}`, data);
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi cập nhật khung giờ ${slotId}:`, error);
            throw error;
        }
    },
    getSlotsByJob: async (jobId, availableOnly = false) => {
        try {
            const response = await api.get(`/interviews/jobs/${jobId}/slots`, {
                params: { availableOnly }
            });
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy danh sách slot cho Job ${jobId}:`, error);
            throw error;
        }
    },

    toggleLockSlot: async (slotId, lockStatus) => {
        try {
            const response = await api.patch(`/interviews/slots/${slotId}/lock`, null, {
                params: { lock: lockStatus }
            });
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi thay đổi trạng thái khóa cho slot ${slotId}:`, error);
            throw error;
        }
    },

    deleteSlot: async (slotId) => {
        try {
            const response = await api.delete(`/interviews/slots/${slotId}`);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi xóa khung giờ:", error);
            throw error;
        }
    },

    getInterviewsByJob: async (jobId) => {
        try {
            const response = await api.get(`/interviews/jobs/${jobId}/interviews`);
            return response.data;
        } catch (error) {
            console.error(`Lỗi lấy danh sách phỏng vấn cho Job ${jobId}:`, error);
            throw error;
        }
    },

    getMySlots: async () => {
        try {
            const response = await api.get('/interviews/my-slots');
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy danh sách khung giờ của bạn:", error);
            throw error;
        }
    },

    getCandidatesBySlot: async (slotId) => {
        try {
            const response = await api.get(`/interviews/slots/${slotId}/candidates`);
            return response.data;
        } catch (error) {
            console.error(`Lỗi lấy danh sách ứng viên cho slot ${slotId}:`, error);
            throw error;
        }
    },
    // --- DÀNH CHO ỨNG VIÊN (CANDIDATE) ---

    bookInterview: async (slotId) => {
        try {
            // Backend đang dùng @RequestParam nên truyền qua params
            const response = await api.post('/interviews/book', null, {
                params: { slotId }
            });
            return response.data;
        } catch (error) {
            console.error("Lỗi khi đặt lịch phỏng vấn:", error);
            throw error;
        }
    },

    getMyInterviews: async () => {
        try {
            const response = await api.get('/interviews/my-interviews');
            return response.data;
        } catch (error) {
            console.error("Lỗi lấy danh sách lịch phỏng vấn của bạn:", error);
            throw error;
        }
    },
};

export default interviewService;