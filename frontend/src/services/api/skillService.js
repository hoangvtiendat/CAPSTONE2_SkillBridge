import api from '../../config/axiosConfig';
const skillService = {
    createSkill: async (skillData) => {
        try {
            const response = await api.post('/skill/Create', skillData);
            return response.data; 
        } catch (error) {
            console.error('Error creating skill:', error);
            throw error;
        }
    },
    getListSkillsOfCategory: async (id) => {
        try {
            const response = await api.get(`/skill/list/${id}`);
            return response.data; 
        } catch (error) {
            console.error('Error fetching skills:', error);
            throw error;
        }
    },
    getDetailSkill: async (id) => {
        try {
            const response = await api.get(`/skill/GetDetail/${id}`);
            return response.data;
        }catch (error) {
            console.error('Error fetching skill details:', error);
            throw error;
        }
    },
    upDateSkill: async (id, skillData) => {
        try{
            const response = await api.put(`/skill/Update/${id}`, skillData);
            return response.data;
        }catch (error) {
            console.error('Error updating skill:', error);
            throw error;
        }
    },
    deleteSkill: async (id) => {
        try {
            const response = await api.delete(`/skill/Delete/${id}`);
            return response.data;
        }catch (error) {
            console.error('Error deleting skill:', error);
            throw error;
        }
    }
}; 
export default skillService;