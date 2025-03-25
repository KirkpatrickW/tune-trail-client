import { PlayerTrack } from "./playerTrack";

export interface PlayerLocality {
    locality_id: string;
    name: string;
    tracks: PlayerTrack[];
}