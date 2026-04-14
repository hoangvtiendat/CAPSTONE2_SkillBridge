import axiosClient from '../../config/axiosConfig';

const analyticsService = {
    getRecruiterSummary: async (params) => {
        const response = await axiosClient.get('/analytics/recruiter/summary', { params });
        // Unwrap ApiResponse { code, message, result }
        return response.data;
    },

    exportRecruiterCsv: async (params) => {
        const response = await axiosClient.get('/analytics/recruiter/export', {
            params,
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'recruitment_analytics.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};

export default analyticsService;
