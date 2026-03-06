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
    const publicPage = ['/login', '/'] 
    const currentPath = window.location.pathname;
    if(error.response && error.response.status === 401){
        if(!publicPage.includes(currentPath)){
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('token');
            
            window.location.href = '/';
        }
    } 
    if(error.response && error.response.status === 403){
         console.log('Bạn không có quyền truy cập vào tài nguyên này.');    
    }
    }
);


export default api;
