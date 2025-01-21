import { mapStyle } from "@/constants/mapStyle";
import { Locality } from "@/types/maps/locality.types";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { LocalityMarker } from "./LocalityMarker";

type Localities = Locality[];

const ZOOM_THRESHOLD = 0.2;

export const Maps = () => {
    const initialRegion: Region = {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    const [localities, setLocalities] = useState<Localities>([]);
    const [region, setRegion] = useState(initialRegion);
    const [loading, setLoading] = useState(false);  // Track loading state

    const fetchLocalities = async (region: Region) => {
        const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
        console.log('Region changed:', {
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta,
        });

        console.log(`Latitude Delta: ${latitudeDelta}, Zoom Threshold: ${ZOOM_THRESHOLD}`)
        if (latitudeDelta < ZOOM_THRESHOLD) {
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
    
            setLoading(true);  // Set loading to true before fetching data
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
            } finally {
                setLoading(false);  // Set loading to false after fetching data
            }
        }
    }

    return (
        <View style={{ flex: 1 }}>
            {loading && (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}><ActivityIndicator size="small" color="#ffffff" /> Loading Localities...</Text>
                </View>
            )}
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
                initialRegion={initialRegion}
                scrollEnabled={!loading}
                zoomEnabled={!loading}>
                {localities.map((locality, index) => (
                    <LocalityMarker locality={locality} index={index}/>
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        position: 'absolute',
        top: '10%',
        left: '25%',
        zIndex: 1,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
});
