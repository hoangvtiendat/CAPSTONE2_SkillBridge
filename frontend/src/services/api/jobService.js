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
                    min: parseInt(job.salaryMin) / 1000, // Corrected to avoid duplicate key
                    max: parseInt(job.salaryMax) / 1000
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Error updating JD:', error);
            throw error;
        }
    }
    
};

export default jobService;
