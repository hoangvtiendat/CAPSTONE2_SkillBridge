import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8081/identity',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        // Không add token cho login/register
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


export default api;
