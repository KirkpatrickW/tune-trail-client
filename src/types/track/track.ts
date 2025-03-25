import { Cover } from "./cover";

export interface Track {
    track_id: string | null;
    spotify_id: string;
    deezer_id: string;
    isrc: string;
    name: string;
    artists: string[];
    cover: Cover
    preview_url?: string;
}