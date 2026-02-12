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
                    min: parseInt(job.salaryMin) / 1000000, // Convert to Millions for UI (e.g. 25000000 -> 25) ? 
                    // Wait, JobCard displays `${salary.min}k`.
                    // If API returns "25000000", UI showing "25000000k" is wrong.
                    // User said "salaryMin": "25000000".
                    // JobCard: `${salary.min}k - ${salary.max}k`
                    // Usually "k" means thousands. 25000000 is 25,000k. 
                    // Maybe divide by 1000? Or just pass raw and update JobCard?
                    // Let's assume we format it to "k" (thousands) or "M" (millions).
                    // If JobCard says "k", likely it expects, e.g., 2000 for $2000.
                    // Let's divide by 1000 for "k" representation.
                    min: parseInt(job.salaryMin) / 1000,
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
    }
};

export default jobService;
