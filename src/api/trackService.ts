import { Track } from '@/types/track/track';
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
    banTrack: async (spotifyTrackId: string): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.patch<{ message: string }>(`${BASE_URL}/${spotifyTrackId}/ban`);
    },
    unbanTrack: async (trackId: string): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.patch<{ message: string }>(`${BASE_URL}/${trackId}/unban`);
    },
    getBannedTracks: async (localityId: string): Promise<AxiosResponse<Track[]>> => {
        return await apiClient.get<Track[]>(`${BASE_URL}/${localityId}/tracks`, { showToast: false });
    },
};
