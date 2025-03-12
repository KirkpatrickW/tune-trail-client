import { LocalityTrack } from '@/types/LocalityTrack';
import type { AxiosResponse } from 'axios';
import { supercluster } from 'react-native-clusterer';
import apiClient from './apiClient';

const BASE_URL = "/localities";

export const localitiesService = {
    getLocalities: async (north: number, east: number, south: number, west: number): Promise<AxiosResponse<supercluster.PointFeature<any>[]>> => {
        return await apiClient.get<supercluster.PointFeature<any>[]>(`${BASE_URL}`, {
            params: {
                north,
                east,
                south,
                west
            },
        });
    },
    getTracksInLocality: async (localityId: string): Promise<AxiosResponse<LocalityTrack[]>> => {
        return await apiClient.get<LocalityTrack[]>(`${BASE_URL}/${localityId}/tracks`);
    },
    addTrackToLocality: async (localityId: string, spotifyTrackId: string): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.put<{ message: string }>(`${BASE_URL}/tracks`, {
            locality_id: localityId,
            spotify_track_id: spotifyTrackId
        });
    },
};
