import api from '../../config/axiosConfig';

const candidateService = {
    parseCv: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/candidates/parse-cv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getCv: async () => {
        try {
            const response = await api.get('/candidates/cv');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAutoCategory: async (query) => {
        try {
            const response = await api.get('/candidates/auto-category', { params: { query } });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAutoSkill: async (query, categoryId) => {
        try {
            const params = { query };
            if (categoryId) params.categoryId = categoryId;
            const response = await api.get('/candidates/auto-skill', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateCv: async (cvData) => {
        try {
            const response = await api.put('/candidates/cv', cvData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    toggleOpenToWork: async (status) => {
        const response = await api.patch(`/candidates/open-to-work?isOpenToWork=${status}`);
        return response.data;
    },
    getPotentialCandidates: async (jobId) => {
        const response = await api.get(`/candidates/potential/${jobId}`);
        return response.data;
    },
};

export default candidateService;
