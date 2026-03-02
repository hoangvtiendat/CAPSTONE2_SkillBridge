import api from '../../config/axiosConfig';

const jobService = {
    getFeed: async (params = {}) => {
        try {
            const { cursor, limit = 10, categoryId, location, salary } = params;
            const queryParams = new URLSearchParams();
            if (cursor) queryParams.append('cursor', cursor);
            if (limit) queryParams.append('limit', limit);
            if (categoryId) queryParams.append('categoryId', categoryId);
            if (location) queryParams.append('location', location);
            if (salary) queryParams.append('salary', salary);

            const response = await api.get(`/jobs/feed?${queryParams.toString()}`);

            // Transform Data for UI
            const result = response.data.result;
            const jobs = (result.jobs || []).map(job => ({
                id: job.jobId,
                position: job.title?.en || job.title?.vi || 'Unknown Position', // Prefer EN, fallback VI
                company: job.companyName,
                location: job.location,
                salary: {
                    min: parseInt(job.salaryMin) / 1000000,
                    max: parseInt(job.salaryMax) / 1000000
                },
                tags: (job.skills || []).map(s => s.skillName || s), // Assuming skills might be objects or strings
                logo: job.companyImageUrl, // URL string
                featured: false // API doesn't seem to return featured flag yet
            }));

            return {
                jobs,
                nextCursor: result.nextCursor,
                hasMore: result.hasMore
            };
        } catch (error) {
            throw error;
        }
    },

    getAdminJobs: async (params = {}) => {
        try {
            const { cursor, limit = 10, status, modStatus } = params;
            const response = await api.get(`/jobs/feedAdmin`, {
                params: { cursor, limit, status, modStatus }
            });

            const result = response.data.result;

            const jobs = (result.adminJobFeedItemResponse || []).map(job => ({
                id: job.jobId,
                description: job.description,
                location: job.location,
                companyName: job.companyName,
                subscriptionPlanName: job.subscriptionPlanName || "N/A",
                categoryName: job.categoryName,
                skills: job.skills || [],
                status: job.status,
                moderationStatus: job.moderationStatus
            }));

            return {
                jobs,
                nextCursor: result.nextCursor,
                hasMore: result.hasMore
            };
        } catch (error) {
            throw error;
        }
    },

    getJobDetailByCandidate: async (jobId) => {
        const response = await api.get(`/jobs/${jobId}`);
        return response.data.result;
    },

    getJobDetail: async (jobId) => {
        const response = await api.get(`/jobs/feedAdmin/${jobId}`);
        return response.data.result;
    },

    deleteJob: async (jobId) => {
        const response = await api.delete(`/jobs/feedAdmin/${jobId}`);
        return response.data;
    },

    changeModerationStatus: async (jobId, status) => {
        const response = await api.patch(`/jobs/feedAdmin/${jobId}/moderation`, null, {
            params: { status }
        });
        return response.data;
    },

    changeStatus: async (jobId, status) => {
        const response = await api.patch(`/jobs/feedAdmin/${jobId}/status`, null, {
            params: { status }
        });
        return response.data;
    }
};

export default jobService;
