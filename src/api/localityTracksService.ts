import { AxiosResponse } from 'axios';
import apiClient from './apiClient';

const BASE_URL = "/locality-tracks";

export const localityTracksService = {
    voteOnLocalityTrack: async (localityTrackId: number, voteValue: 1 | 0 | -1): Promise<AxiosResponse<{ message: string }>> => {
        return await apiClient.patch<{ message: string }>(`${BASE_URL}/${localityTrackId}/vote`, {
            vote_value: voteValue
        });
    },
};