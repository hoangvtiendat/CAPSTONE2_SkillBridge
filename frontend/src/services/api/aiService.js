import api from '../../config/axiosConfig';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

const mapAiJobToCard = (job) => ({
    id: job.id || job.jobId,
    position: job.position || job.title?.vi || job.title?.en || job.title || 'Unknown Position',
    company: job.company?.name || job.companyName || 'Unknown Company',
    location: job.location || 'Unknown Location',
    salary: {
        min: Number(job.salaryMin || 0),
        max: Number(job.salaryMax || 0)
    },
    tags: Array.isArray(job.skills)
        ? job.skills.map((skill) => skill.name || skill.skillName || skill).filter(Boolean)
        : [],
    logo: job.company?.logoUrl || job.companyImageUrl || null,
    featured: false
});

 
const aiService = {
        semanticSearch: async (query) => {
        try {
            const response = await api.post('/Ai-skillbridge/ai-semantic-search', {
                description: query
            }, {
                headers: getHeaders()
            });

            const result = response.data?.result ?? response.data ?? [];
            const rawJobs = Array.isArray(result)
                ? result
                : result.jobs || result.items || result.content || [];

            return rawJobs.map(mapAiJobToCard);
        } catch (error) {
            console.error('Error performing semantic search:', error);
            throw error;
        }
    }
};

export default aiService;