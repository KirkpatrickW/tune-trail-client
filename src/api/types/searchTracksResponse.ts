export interface SearchTracksResponse {
    next_offset: number;
    total_matching_results: number;
    results: TrackType[];
}

export interface TrackType {
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