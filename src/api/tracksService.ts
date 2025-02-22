import type { AxiosResponse, CancelTokenSource } from 'axios';
import apiClient from './apiClient';
import type { SearchTracksResponse } from './types/searchTracksResponse';

const BASE_URL = "/tracks";

export const tracksService = {
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
