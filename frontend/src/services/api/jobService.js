import api from '../../config/axiosConfig';

const jobService = {
    getFeed: async (params = {}) => {
        try {
            const {page = 0, limit = 6, categoryId, location, salary} = params;
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', limit);
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
                    min: parseInt(job.salaryMin) / 1000, // Corrected to avoid duplicate key
                    max: parseInt(job.salaryMax) / 1000
                },
                tags: (job.skills || []).map(s => s.skillName || s), // Assuming skills might be objects or strings
                logo: job.companyImageUrl, // URL string
                featured: false // API doesn't seem to return featured flag yet
            }));

            return {
                jobs,
                totalPages: result.totalPages || 0,
                totalElements: result.totalElements || 0,
                currentPage: result.currentPage || 0
            };
        } catch (error) {
            throw error;
        }
    },
    getMyJd_of_Company: async (token) => {
        try {
            const response = await api.get(`/jobs/my-company`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching JD:', error);
            throw error;
        }
    },
    deleteJd: async (jdId) => {
        try {
            await api.delete(`/jobs/my-company/delete/${jdId}`);
        } catch (error) {
            console.error('Error deleting JD:', error);
            throw error;
        }
    },
    getDetailJd: async (id) => {
        try {
            const response = await api.get(`/jobs/my-company/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching JD details:', error);
            throw error;
        }
    },
    createJd: async (jdData) => {
        try {
            const response = await api.post('/jobs/postJD', jdData);
            return response.data;
        } catch (error) {
            console.error('Error creating JD:', error);
            throw error;
        }
    },
    updateJd: async (id, jdData) => {
        try {
            const response = await api.put(`/jobs/my-company/Update/${id}`, jdData);
            return response.data;
        } catch (error) {
            console.error('Error updating JD:', error);
            throw error;
        }
    },

    getAdminJobs: async (params = {}) => {
        try {
            const {cursor, limit = 10, status, modStatus} = params;
            const response = await api.get(`/jobs/feedAdmin`, {
                params: {cursor, limit, status, modStatus}
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
            params: {status}
        });
        return response.data;
    },

    changeStatus: async (jobId, status) => {
        const response = await api.patch(`/jobs/feedAdmin/${jobId}/status`, null, {
            params: {status}
        });
        return response.data;
    }

};

export default jobService;
