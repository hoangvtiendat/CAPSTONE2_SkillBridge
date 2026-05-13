import api from "../../config/axiosConfig";

const notificationService = {
    getNotifications: async () => {
        const response = await api.get("/notifications");
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.patch("/notifications/read-all");
        return response.data;
    },
    notificationByAI: async() => {
        const response = await api.get("/notifications/Ai");
        return response.data;
    }
};

export default notificationService;
