import { UserDetails } from '@/types/auth/user_details';
import { AxiosResponse } from 'axios';
import apiClient from './apiClient';

const BASE_URL = "/auth";

export const authService = {
    register: async (username: string, password: string): Promise<AxiosResponse<{ access_token: string, user_details: Partial<UserDetails> }>> => {
        return await apiClient.post<{ access_token: string, user_details: Partial<UserDetails> }>(`${BASE_URL}/register`, {
            username,
            password,
        }, { showToast: false });
    },
    login: async (username: string, password: string): Promise<AxiosResponse<{ access_token: string, user_details: Partial<UserDetails> }>> => {
        const credentials = btoa(`${username}:${password}`);
        return await apiClient.post<{ access_token: string, user_details: Partial<UserDetails> }>(`${BASE_URL}/login`, {}, {
            headers: {
                Authorization: `Basic ${credentials}`,
            },
            showToast: false
        });
    },
    connectSpotify: async (authCode: string): Promise<AxiosResponse<{ access_token: string, user_details: Partial<UserDetails> }>> => {
        return await apiClient.put<{ access_token: string, user_details: Partial<UserDetails> }>(`${BASE_URL}/connect-spotify`, {
            auth_code: authCode
        });
    },
    completeSpotify: async (username: string): Promise<AxiosResponse<{ message: string, user_details: Partial<UserDetails> }>> => {
        return await apiClient.put<{ message: string, user_details: Partial<UserDetails> }>(`${BASE_URL}/complete-spotify`, {
            username,
        }, { showToast: false });
    },
    linkSpotify: async (authCode: string): Promise<AxiosResponse<{ access_token: string, user_details: Partial<UserDetails> }>> => {
        return await apiClient.put<{ access_token: string, user_details: Partial<UserDetails> }>(`${BASE_URL}/link-spotify`, {
            auth_code: authCode
        });
    },
    unlinkSpotify: async (): Promise<AxiosResponse<{ access_token: string, user_details: Partial<UserDetails> }>> => {
        return await apiClient.delete<{ access_token: string, user_details: Partial<UserDetails> }>(`${BASE_URL}/unlink-spotify`);
    },
    logout: async (): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.put<{ message: string }>(`${BASE_URL}/logout`);
    },
};