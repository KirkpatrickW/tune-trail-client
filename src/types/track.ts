export interface Track {
    track_id: string | null;
    spotify_id: string;
    deezer_id: string;
    isrc: string;
    name: string;
    artists: string[];
    cover: {
        small: string | null;
        medium: string | null;
        large: string;
    };
    preview_url?: string;
}