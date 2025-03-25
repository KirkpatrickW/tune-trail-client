import { Locality } from "@/types/locality/locality";
import { Track } from "@/types/track/track";

export interface AddTrackToLocalityResponse {
    locality: Locality;
    results: Track;
}