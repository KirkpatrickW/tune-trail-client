import { Cover } from "../track/cover";

export interface LocalityTrack {
    locality_track_id: number;
    user_id: string;
    username: string;
    track_id: string;
    spotify_id: string;
    name: string;
    artists: string[];
    cover: Cover;
    total_votes: number;
    user_vote: number;
}