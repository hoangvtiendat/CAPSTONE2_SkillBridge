import api from '../../config/axiosConfig';
 
const categoryJDService = {
    getListCategories: async () => {
        try {
            const response = await api.get('/CategoryProfession/listCategory');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default categoryJDService;