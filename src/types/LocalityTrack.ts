export interface LocalityTrack {
    user_id: string;
    username: string;
    track_id: string;
    name: string;
    artists: string[];
    cover: {
        small: string | null;
        medium: string | null;
        large: string;
    };
}