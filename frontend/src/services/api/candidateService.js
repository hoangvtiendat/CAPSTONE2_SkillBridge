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

    updateCv: async (cvData) => {
        try {
            //console.log("SEND DATA:", JSON.stringify(cvData, null, 2));
            const response = await api.put('/candidates/cv', cvData);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default candidateService;
