import { mapStyle } from "@/constants/mapStyle";
import { useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from "react-native";
import { Clusterer, supercluster } from "react-native-clusterer";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { LocalityCluster } from "./LocalityCluster";
import { LocalityMarker } from "./LocalityMarker";

export const Maps = () => {
    const [pointFeatures, setPointFeatures] = useState<supercluster.PointFeature<any>[]>([]);
    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState<Region>({
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    const { width, height } = Dimensions.get('window');

    const getZoomLevel = (longitudeDelta: number) => {
        return Math.round(Math.log(360 / longitudeDelta) / Math.LN2);
    };

    const fetchLocalities = async (region: Region) => {
        const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
        console.log('Region changed:', {
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta,
        });

        const zoomLevel = getZoomLevel(latitudeDelta);
        console.log("Zoom level:", zoomLevel);
        if (zoomLevel >= 8) {
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

            setLoading(true);
            try {
                const response = await fetch(url);
                const data = await response.json();
                console.log('Raw data received:', data);

                if (data.elements) {
                    const extractedPointFeatures = data.elements
                        .filter((element: any) => element.tags?.name)
                        .map((element: any) => ({
                            type: 'Feature',
                            properties: { name: element.tags.name },
                            geometry: {
                                type: 'Point',
                                coordinates: [element.lon, element.lat],
                            },
                        }));
                    console.log('Extracted point features:', extractedPointFeatures);

                    setPointFeatures(extractedPointFeatures);
                }
            } catch (error) {
                console.error('Error fetching localities:', error);
            } finally {
                setLoading(false);
            }
        } else {
            setPointFeatures([]);
        }
    };

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
                    setRegion(region);
                    fetchLocalities(region);
                }}
                rotateEnabled={false}
                scrollEnabled={!loading}
                zoomEnabled={!loading}
                initialRegion={region}>
                <Clusterer
                    data={pointFeatures}
                    mapDimensions={{ width, height }}
                    region={region}
                    renderItem={(item, index) => {
                        return item.properties.cluster ? (
                            <LocalityCluster clusterFeature={item} index={index} />
                        ) : (
                            <LocalityMarker pointFeature={item} index={index} />
                        );
                    }}/>
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
