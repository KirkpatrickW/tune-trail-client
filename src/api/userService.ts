import { SearchUsersResponse } from '@/types/api/searchUsersResponse';
import type { AxiosResponse, CancelTokenSource } from 'axios';
import apiClient from './apiClient';

const BASE_URL = "/users";

export const userService = {
    searchUsers: async (query: string, offset: number = 0, cancelToken?: CancelTokenSource): Promise<AxiosResponse<SearchUsersResponse>> => {
        return await apiClient.get<SearchUsersResponse>(`${BASE_URL}/search`, {
            params: {
                q: query,
                offset: offset
            },
            cancelToken: cancelToken?.token
        });
    },
    deleteUser: async (userId: number): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.delete<{ message: string }>(`${BASE_URL}/${userId}`);
    },
    invalidateUserSessions: async (userId: number): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.patch<{ message: string }>(`${BASE_URL}/${userId}/invalidate-session`);
    }
};
