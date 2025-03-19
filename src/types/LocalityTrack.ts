export interface LocalityTrack {
    locality_track_id: number;
    user_id: string;
    username: string;
    track_id: string;
    spotify_id: string;
    name: string;
    artists: string[];
    cover: {
        small: string | null;
        medium: string | null;
        large: string;
    };
    total_votes: number;
    user_vote: number;
}