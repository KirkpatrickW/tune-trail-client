import { mapStyle } from "@/constants/mapStyle";
import { Locality } from "@/types/maps/locality.types";
import { useState } from "react";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { LocalityMarker } from "./LocalityMarker";

type Localities = Locality[];

export const Maps = () => {
    const initialRegion: Region = {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    const [localities, setLocalities] = useState<Localities>([]);
    const [region, setRegion] = useState(initialRegion);

    const fetchLocalities = async (region: Region) => {
        const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
        console.log('Region changed:', {
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta,
        });

        const bounds = {
            north: latitude + latitudeDelta / 2,
            south: latitude - latitudeDelta / 2,
            east: longitude + longitudeDelta / 2,
            west: longitude - longitudeDelta / 2,
        };
        console.log('Bounds:', bounds);

        const query = `
        [out:json];
        (
            node["place"="city"]( ${bounds.south}, ${bounds.west}, ${bounds.north}, ${bounds.east} );
            node["place"="town"]( ${bounds.south}, ${bounds.west}, ${bounds.north}, ${bounds.east} );
            node["place"="village"]( ${bounds.south}, ${bounds.west}, ${bounds.north}, ${bounds.east} );
            node["place"="hamlet"]( ${bounds.south}, ${bounds.west}, ${bounds.north}, ${bounds.east} );
        );
        out;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        console.log('Fetching data from:', url);

        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log('Raw data received:', data);
      
            if (data.elements) {
                const extractedLocalities: Localities = data.elements
                    .filter((element: any) => element.tags?.name)
                    .map((element: any) => ({
                        name: element.tags.name,
                        latitude: element.lat,
                        longitude: element.lon
                    }));
                console.log('Extracted localities:', extractedLocalities);
                
                setLocalities(extractedLocalities);
            }
        } catch (error) {
            console.error('Error fetching localities:', error);
        }
    }

    return (
        <MapView 
            style={{ width: '100%', height: '100%' }}
            provider={PROVIDER_GOOGLE}
            customMapStyle={mapStyle}
            toolbarEnabled={false}
            moveOnMarkerPress={false}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            onRegionChangeComplete={(region) => {
                fetchLocalities(region);
                setRegion(region);
            }}
            rotateEnabled={false}
            initialRegion={initialRegion}>
            {localities.map((locality, index) => (
                <LocalityMarker locality={locality} index={index}/>
            ))}
        </MapView>
    );
}