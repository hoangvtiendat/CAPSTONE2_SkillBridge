import api from '../../config/axiosConfig';

const adminService = {
    // User Management
    getUsers: async (params = {}) => {
        const { page = 0, size = 10, sortBy = 'createdAt', direction = 'desc', name, email, role, status } = params;
        const queryParams = new URLSearchParams({ page, size, sortBy, direction });
        if (name) queryParams.append('name', name);
        if (email) queryParams.append('email', email);
        if (role) queryParams.append('role', role);
        if (status) queryParams.append('status', status);

        const response = await api.get(`/admin/users?${queryParams.toString()}`);
        return response.data;
    },

    banUser: async (id) => {
        const response = await api.put(`/admin/users/${id}/ban`);
        return response.data;
    },

    unbanUser: async (id) => {
        const response = await api.put(`/admin/users/${id}/unban`);
        return response.data;
    },

    // Company Management
    getCompanies: async (params = {}) => {
        const { page = 0, size = 10, sortBy = 'createdAt', direction = 'desc', name, taxId, status } = params;
        const queryParams = new URLSearchParams({ page, size, sortBy, direction });
        if (name) queryParams.append('name', name);
        if (taxId) queryParams.append('taxId', taxId);
        if (status) queryParams.append('status', status);

        const response = await api.get(`/admin/companies?${queryParams.toString()}`);
        return response.data;
    },

    banCompany: async (id) => {
        const response = await api.put(`/admin/companies/${id}/ban`);
        return response.data;
    },

    unbanCompany: async (id) => {
        const response = await api.put(`/admin/companies/${id}/unban`);
        return response.data;
    },

    // Industry (Category) Management
    getCategories: async (params = {}) => {
        const { page = 0, size = 10, sortBy = 'createdAt', direction = 'desc' } = params;
        const queryParams = new URLSearchParams({ page, size, sortBy, direction });

        const response = await api.get(`/admin/categories?${queryParams.toString()}`);
        return response.data;
    },

    createCategory: async (data) => {
        const response = await api.post('/admin/categories', data);
        return response.data;
    },

    updateCategory: async (id, data) => {
        const response = await api.put(`/admin/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id) => {
        const response = await api.delete(`/admin/categories/${id}`);
        return response.data;
    }
};

export default adminService;
