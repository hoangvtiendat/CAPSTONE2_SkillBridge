import axiosClient from '../../config/axiosConfig';

const provincesServices = {
    getProvinces: async () => {
        const response = await axiosClient.get('/jobs/ListProvinces');
        return response.data;
    },

    updateProvince: async (id, payload) => {
        const response = await axiosClient.put(`/jobs/Update-provinces/${id}`, payload);
        return response.data;
    }
};

export default provincesServices;
