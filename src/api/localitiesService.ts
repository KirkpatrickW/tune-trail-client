import { Locality } from '@/types/locality';
import { Track } from '@/types/track';
import type { AxiosResponse } from 'axios';
import { supercluster } from 'react-native-clusterer';
import apiClient from './apiClient';
import { AddTrackToLocalityResponse } from './types/addTrackToLocalityResponse';

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
    getTracksInLocality: async (localityId: string): Promise<AxiosResponse<Track[]>> => {
        return await apiClient.get<Track[]>(`${BASE_URL}/${localityId}/tracks`);
    },
    addTrackToLocality: async (locality: Locality, track: Track): Promise<AxiosResponse<AddTrackToLocalityResponse>> => {
        return await apiClient.put<AddTrackToLocalityResponse>(`${BASE_URL}`, {
            locality,
            track
        });
    },
};
