import { Cover } from "../track/cover";

export interface PlayerTrack {
    track_id: string;
    name: string;
    artists: string[];
    cover: Cover;
    preview_url: string;
}