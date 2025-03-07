import { AxiosResponse } from 'axios';
import apiClient from './apiClient';

const BASE_URL = "/auth";

export const authService = {
    register: async (username: string, password: string): Promise<AxiosResponse<{ access_token: string }>> => {
        return await apiClient.post<{ access_token: string }>(`${BASE_URL}/register`, {
            username,
            password,
        }, { showToast: false });
    },
    login: async (username: string, password: string): Promise<AxiosResponse<{ access_token: string }>> => {
        const credentials = btoa(`${username}:${password}`);
        return await apiClient.post<{ access_token: string }>(`${BASE_URL}/login`, {}, {
            headers: {
                Authorization: `Basic ${credentials}`,
            },
            showToast: false
        });
    },
    connectSpotify: async (code: string, redirectUri: string): Promise<AxiosResponse<{ access_token: string }>> => {
        return await apiClient.put<{ access_token: string }>(`${BASE_URL}/connect-spotify`, {
            code,
            redirect_uri: redirectUri,
        }, { showToast: false });
    },
    completeSpotify: async (username: string): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.put<{ message: string }>(`${BASE_URL}/complete-spotify`, {
            username,
        });
    },
    linkSpotify: async (code: string, redirectUri: string): Promise<AxiosResponse<{ access_token: string }>> => {
        return await apiClient.put<{ access_token: string }>(`${BASE_URL}/link-spotify`, {
            code,
            redirect_uri: redirectUri,
        }, { showToast: false });
    },
    unlinkSpotify: async (): Promise<AxiosResponse<{ access_token: string }>> => {
        return await apiClient.delete<{ access_token: string }>(`${BASE_URL}/unlink-spotify`, { showToast: false });
    },
    logout: async (): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.put<{ message: string }>(`${BASE_URL}/logout`);
    },
};