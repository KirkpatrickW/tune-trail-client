import { Locality } from "@/types/locality";
import { Track } from "@/types/track";

export interface AddTrackToLocalityResponse {
    locality: Locality;
    results: Track;
}