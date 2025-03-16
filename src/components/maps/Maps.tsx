import { localitiesService } from "@/api/localitiesService";
import { mapStyle } from "@/constants/mapStyle";
import { useLocation } from "@/context/LocationContext";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from "react-native";
import { Clusterer, supercluster } from "react-native-clusterer";
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { LocalityCluster } from "./LocalityCluster";
import { LocalityMarker } from "./LocalityMarker";

export const Maps = () => {
    const { userLocation } = useLocation();
    const [pointFeatures, setPointFeatures] = useState<supercluster.PointFeature<any>[]>([]);
    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState<Region>({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 180,
        longitudeDelta: 180,
    });
    const [hasAnimatedToUserLocation, setHasAnimatedToUserLocation] = useState(false);

    const mapRef = useRef<MapView>(null);

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

        const zoomLevel = getZoomLevel(longitudeDelta);
        console.log("Zoom level:", zoomLevel);
        if (zoomLevel >= 8) {
            const bounds = {
                north: latitude + latitudeDelta / 2,
                south: latitude - latitudeDelta / 2,
                east: longitude + longitudeDelta / 2,
                west: longitude - longitudeDelta / 2,
            };
            console.log('Bounds:', bounds);

            setLoading(true);
            try {
                const getLocalitiesResponse = await localitiesService.getLocalities(bounds.north, bounds.east, bounds.south, bounds.west);
                setPointFeatures(getLocalitiesResponse.data);
            } catch (error) {
                console.error('Error fetching localities:', error);
            } finally {
                setLoading(false);
            }
        } else {
            setPointFeatures([]);
        }
    };

    useEffect(() => {
        if (userLocation && mapRef.current && !hasAnimatedToUserLocation) {
            const newRegion: Region = {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: 0.0022,
                longitudeDelta: 0.005,
            };
            mapRef.current.animateToRegion(newRegion, 1000);
            setHasAnimatedToUserLocation(true);
        }
    }, [userLocation, hasAnimatedToUserLocation]);

    return (
        <View style={{ flex: 1 }}>
            {loading && (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}><ActivityIndicator size="small" color="#ffffff" /> Loading Localities...</Text>
                </View>
            )}
            <MapView
                ref={mapRef}
                style={{ width: '100%', height: '100%' }}
                provider={PROVIDER_GOOGLE}
                customMapStyle={mapStyle}
                toolbarEnabled={false}
                moveOnMarkerPress={false}
                showsCompass={false}
                onRegionChangeComplete={(region) => {
                    setRegion(region);
                    fetchLocalities(region);
                }}
                rotateEnabled={false}
                scrollEnabled={!loading}
                zoomEnabled={!loading}
                initialRegion={region}>
                {userLocation && (
                    <>
                        <Marker
                            coordinate={{
                                latitude: userLocation.coords.latitude,
                                longitude: userLocation.coords.longitude,
                            }}
                            anchor={{ x: 0.5, y: 0.5 }}>
                            <View style={styles.userLocationContainer}>
                                <View style={styles.userLocationDot} />
                            </View>
                        </Marker>
                        <Circle
                            center={{
                                latitude: userLocation.coords.latitude,
                                longitude: userLocation.coords.longitude,
                            }}
                            radius={5000}
                            strokeWidth={2}
                            strokeColor="#6b2367"
                            fillColor="rgba(107, 35, 103, 0.2)"
                        />
                    </>
                )}
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
                    }} />
            </MapView>
        </View>
    );
};

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
    userLocationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    userLocationDot: {
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: '#6b2367',
        borderWidth: 2,
        borderColor: 'white',
    },
});