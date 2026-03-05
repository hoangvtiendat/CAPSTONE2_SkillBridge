import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8081/identity',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        if (
            token &&
            !config.url.includes('/auth/login') &&
            !config.url.includes('/auth/register')
        ) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            
            window.location.href = '/login';
        }
        
        if (error.response && error.response.status === 403) {
            console.error('Không có quyền truy cập tài nguyên này');
        }
        
        return Promise.reject(error);
    }
);


export default api;
