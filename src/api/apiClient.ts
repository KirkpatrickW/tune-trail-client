import axios from 'axios';

const BASE_URL = 'http://10.0.2.2:8000';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            return Promise.reject({
                status: error.response.status,
                data: error.response.data,
                message: error.response.data?.message || 'An error occurred',
            });
        } else if (error.request) {
            return Promise.reject({ message: 'No response from server' });
        } else {
            return Promise.reject({ message: error.message });
        }
    }
);

export default apiClient;