import { LocalityTrack } from '@/types/locality/localityTrack';
import { PlayerLocality } from '@/types/player/playerLocality';


import type { AxiosResponse } from 'axios';
import { supercluster } from 'react-native-clusterer';
import apiClient from './apiClient';

const BASE_URL = "/localities";

export const localityService = {
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
    getTracksForLocalities: async (latitude: number, longitude: number, radius: number): Promise<AxiosResponse<PlayerLocality[]>> => {
        return await apiClient.get<PlayerLocality[]>(`${BASE_URL}/tracks`, {
            params: {
                latitude,
                longitude,
                radius
            }
        });
    },
    getTracksInLocality: async (localityId: string): Promise<AxiosResponse<LocalityTrack[]>> => {
        return await apiClient.get<LocalityTrack[]>(`${BASE_URL}/${localityId}/tracks`);
    },
    addTrackToLocality: async (localityId: string, spotifyTrackId: string): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.put<{ message: string }>(`${BASE_URL}/${localityId}/tracks/${spotifyTrackId}`);
    },
};
