import axios from 'axios';
import { Check } from 'lucide-react';

const API_URL = 'http://localhost:8081/identity/applications';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

const applicationService = {
    // Lấy danh sách ứng viên theo Job ID
    getApplicationsByJob: async (jobId) => {
        const response = await axios.get(`${API_URL}/job/${jobId}`, { headers: getHeaders() });
        return response.data;
    },

    // Lấy chi tiết 1 đơn ứng tuyển
    getApplicationDetail: async (id) => {
        const response = await axios.get(`${API_URL}/${id}`, { headers: getHeaders() });
        return response.data;
    },

    // Phản hồi ứng viên (Thay đổi trạng thái)
    respondToApplication: async (id, status) => {
        const response = await axios.post(`${API_URL}/${id}/respond`, { status }, { headers: getHeaders() });
        return response.data;
    },
    // check TRUE/FALSE nếu đã ứng tuyển vào JD nào đó
   CheckApplied: async (jobId) => {
    try{
        const response = await axios.get(`${API_URL}/JD/Check-apply/${jobId}`, { headers: getHeaders() });
        return response.data;
    } catch (error) {
        console.error('Error checking application status:', error);
        throw error;
    }
   }
};

export default applicationService;