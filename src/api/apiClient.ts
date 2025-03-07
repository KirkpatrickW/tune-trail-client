import { parseBackendError } from '@/utils/errorUtils';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

declare module 'axios' {
    export interface AxiosRequestConfig {
        showToast?: boolean;
    }
}

const BASE_URL = 'http://10.0.2.2:8000';

// These variables will hold references to the methods from AuthContext.
// We need to do this because apiClient.ts is not a React component or hook,
// so it cannot directly use the useAuth() hook to access AuthContext methods.
let setAuthContextAccessToken: (token: string) => Promise<void>;
let clearAuthContextAccessToken: () => Promise<void>;
let showSessionUnavailableModal: () => void;

// This function configures the apiClient with the necessary methods from AuthContext.
// It allows apiClient to interact with AuthContext (e.g., updating the access token,
// clearing the token, or showing the session unavailable modal) without directly
// depending on React hooks or components.
export const configureApiClient = (authMethods: {
    setAccessToken: (token: string) => Promise<void>;
    clearAccessToken: () => Promise<void>;
    showSessionUnavailableModal: () => void;
}) => {
    setAuthContextAccessToken = authMethods.setAccessToken;
    clearAuthContextAccessToken = authMethods.clearAccessToken;
    showSessionUnavailableModal = authMethods.showSessionUnavailableModal;
};

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.showToast === undefined) {
            config.showToast = true;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        if (response.config.showToast && response.data?.message) {
            Toast.show({
                type: 'success',
                text1: 'Success!',
                text2: response.data.message,
            });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            const accessToken = await SecureStore.getItemAsync('access_token');

            if (!accessToken) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return apiClient(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.put(`${BASE_URL}/auth/refresh-token`, {}, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const newAccessToken = response.data.access_token;
                await setAuthContextAccessToken(newAccessToken);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                await clearAuthContextAccessToken();

                showSessionUnavailableModal();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        if (originalRequest.showToast && error.response?.data) {
            const parsedBackendErrors = parseBackendError(error.response.data.detail);

            let toastMessage: string;
            if (parsedBackendErrors.length === 1) {
                toastMessage = parsedBackendErrors[0];
            } else {
                toastMessage = parsedBackendErrors.map((err) => `• ${err}`).join('\n');
            }

            Toast.show({
                type: 'error',
                text1: `Error ${error.response.status}`,
                text2: toastMessage,
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;