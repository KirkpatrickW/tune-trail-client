import type { AxiosResponse, CancelTokenSource } from 'axios';
import type { SearchTracksResponse } from '../types/api/searchTracksResponse';
import apiClient from './apiClient';

const BASE_URL = "/tracks";

export const trackService = {
    searchTracks: async (query: string, offset: number = 0, cancelToken?: CancelTokenSource): Promise<AxiosResponse<SearchTracksResponse>> => {
        return await apiClient.get<SearchTracksResponse>(`${BASE_URL}/search`, {
            params: {
                q: query,
                offset: offset
            },
            cancelToken: cancelToken?.token
        });
    },
};
