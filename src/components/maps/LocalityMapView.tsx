import { localitiesService } from "@/api/localitiesService";
import { mapStyle } from "@/constants/mapStyle";
import { useLocation } from "@/context/LocationContext";
import { usePlayer } from "@/context/PlayerContext";
import * as Location from "expo-location";
import { debounce } from "lodash";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Clusterer, supercluster } from "react-native-clusterer";
import MapView, { Circle, Marker, Polygon, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { LocalityCluster } from "./LocalityCluster";
import { LocalityMarker } from "./LocalityMarker";

interface Bounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

interface GridCache {
    [key: string]: {
        data: supercluster.PointFeature<any>[];
        timestamp: number;
    };
}

export interface LocalityMapViewHandle {
    recenterMap: () => void;
}

interface LocalityMapViewProps {
    onLockStatusChange?: (isLocked: boolean) => void;
    onFetchingGridsChange?: (isFetching: boolean) => void;
    onAreaNameChange?: (areaName: string) => void;
}

const USER_LOCATION_LOCK_LATITUDE_DELTA = 0.26;
const USER_LOCATION_LOCK_LONGITUDE_DELTA = 0.15;
const USER_LOCATION_LOCK_TOLERANCE = 0.001;

const SHOW_FETCHING_GRIDS_DEBUG_OVERLAY = true;

const MIN_ZOOM_LEVEL_FOR_LOCALITIES = 11;

const GRID_SIZE = 0.075;
const CACHE_TTL = 5 * 60 * 1000;

const gridCache: GridCache = {};

const getGridKey = (latitude: number, longitude: number): string => {
    const latGrid = Math.floor(latitude / GRID_SIZE);
    const lonGrid = Math.floor(longitude / GRID_SIZE);
    return `${latGrid},${lonGrid}`;
};

const getCachedGrid = (gridKey: string): supercluster.PointFeature<any>[] | null => {
    const cachedGrid = gridCache[gridKey];
    if (cachedGrid && Date.now() - cachedGrid.timestamp < CACHE_TTL) {
        return cachedGrid.data;
    }
    return null;
};

const setCachedGrid = (gridKey: string, data: supercluster.PointFeature<any>[]) => {
    gridCache[gridKey] = {
        data,
        timestamp: Date.now(),
    };
};

const mergePointFeatures = (
    existing: supercluster.PointFeature<any>[],
    newData: supercluster.PointFeature<any>[]
): supercluster.PointFeature<any>[] => {
    const uniqueFeatures = new Map<string, supercluster.PointFeature<any>>();

    existing.forEach((feature) => {
        const key = `${feature.properties.id}-${feature.geometry.coordinates.join(",")}`;
        uniqueFeatures.set(key, feature);
    });

    newData.forEach((feature) => {
        const key = `${feature.properties.id}-${feature.geometry.coordinates.join(",")}`;
        uniqueFeatures.set(key, feature);
    });

    return Array.from(uniqueFeatures.values());
};

const getZoomLevel = (longitudeDelta: number): number => {
    return Math.round(Math.log(360 / longitudeDelta) / Math.LN2);
};

export const LocalityMapView = forwardRef<LocalityMapViewHandle, LocalityMapViewProps>(({ onLockStatusChange, onFetchingGridsChange, onAreaNameChange }, ref) => {
    const { userLocation } = useLocation();
    const { radius: userRadius } = usePlayer();
    const { width, height } = Dimensions.get("window");

    const [isLocked, setIsLocked] = useState(true);
    const [pointFeatures, setPointFeatures] = useState<supercluster.PointFeature<any>[]>([]);
    const [region, setRegion] = useState<Region>({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 180,
        longitudeDelta: 180,
    });
    const [fetchingGridCount, setFetchingGridCount] = useState(0);

    const fetchingGrids = useRef<Set<string>>(new Set());
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        onFetchingGridsChange?.(fetchingGridCount > 0);
    }, [fetchingGridCount, onFetchingGridsChange]);

    useEffect(() => {
        onLockStatusChange?.(isLocked);
    }, [isLocked, onLockStatusChange]);

    useEffect(() => {
        if (userLocation && isLocked) {
            const newRegion = {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
                latitudeDelta: USER_LOCATION_LOCK_LATITUDE_DELTA,
                longitudeDelta: USER_LOCATION_LOCK_LONGITUDE_DELTA,
            };

            const interval = setInterval(() => {
                if (mapRef.current) {
                    mapRef.current.animateToRegion(newRegion, 1000);
                    setRegion(newRegion);
                    debouncedFetchLocalities(newRegion);
                    clearInterval(interval);
                }
            }, 100);

            return () => clearInterval(interval);
        }
    }, [userLocation, isLocked]);

    useImperativeHandle(ref, () => ({
        recenterMap: () => {
            if (userLocation) {
                const newRegion = {
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                    latitudeDelta: USER_LOCATION_LOCK_LATITUDE_DELTA,
                    longitudeDelta: USER_LOCATION_LOCK_LONGITUDE_DELTA,
                };
                mapRef.current?.animateToRegion(newRegion, 1000);
                setIsLocked(true);
            }
        },
    }));

    const fetchLocalities = async (region: Region) => {
        const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
        const zoomLevel = getZoomLevel(longitudeDelta);

        if (zoomLevel >= MIN_ZOOM_LEVEL_FOR_LOCALITIES) {
            const bounds = {
                north: latitude + latitudeDelta / 2,
                south: latitude - latitudeDelta / 2,
                east: longitude + longitudeDelta / 2,
                west: longitude - longitudeDelta / 2,
            };

            const visibleGrids: Bounds[] = [];
            const startLat = Math.floor(bounds.south / GRID_SIZE) * GRID_SIZE;
            const startLon = Math.floor(bounds.west / GRID_SIZE) * GRID_SIZE;

            for (let lat = startLat; lat < bounds.north; lat += GRID_SIZE) {
                for (let lon = startLon; lon < bounds.east; lon += GRID_SIZE) {
                    const gridNorth = lat + GRID_SIZE;
                    const gridSouth = lat;
                    const gridEast = lon + GRID_SIZE;
                    const gridWest = lon;

                    if (
                        gridNorth > bounds.south &&
                        gridSouth < bounds.north &&
                        gridEast > bounds.west &&
                        gridWest < bounds.east
                    ) {
                        visibleGrids.push({
                            north: gridNorth,
                            south: gridSouth,
                            east: gridEast,
                            west: gridWest,
                        });
                    }
                }
            }

            try {
                visibleGrids.forEach((grid) => {
                    const gridKey = getGridKey(grid.south, grid.west);
                    const cachedData = getCachedGrid(gridKey);

                    if (cachedData) {
                        setPointFeatures((prev) => mergePointFeatures(prev, cachedData));
                    } else if (!fetchingGrids.current.has(gridKey)) {
                        fetchingGrids.current.add(gridKey);
                        setFetchingGridCount(fetchingGrids.current.size);

                        localitiesService
                            .getLocalities(grid.north, grid.east, grid.south, grid.west)
                            .then((response) => {
                                setCachedGrid(gridKey, response.data);
                                setPointFeatures((prev) => mergePointFeatures(prev, response.data));
                            })
                            .catch((error) => {
                                console.error("Error fetching grid data:", error);
                            })
                            .finally(() => {
                                fetchingGrids.current.delete(gridKey);
                                setFetchingGridCount(fetchingGrids.current.size);
                            });
                    }
                });
            } catch (error) {
                console.error("Error fetching localities:", error);
            }
        } else {
            setPointFeatures([]);
        }
    };

    const debouncedFetchLocalities = debounce(fetchLocalities, 500);

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={{ width: "100%", height: "100%" }}
                provider={PROVIDER_GOOGLE}
                customMapStyle={mapStyle}
                toolbarEnabled={false}
                moveOnMarkerPress={false}
                showsCompass={false}
                onRegionChangeComplete={async (region) => {
                    setRegion(region);
                    debouncedFetchLocalities(region);

                    if (userLocation) {
                        const isRegionAtUserLocation =
                            Math.abs(region.latitude - userLocation.coords.latitude) < USER_LOCATION_LOCK_TOLERANCE &&
                            Math.abs(region.longitude - userLocation.coords.longitude) < USER_LOCATION_LOCK_TOLERANCE &&
                            Math.abs(region.latitudeDelta - USER_LOCATION_LOCK_LATITUDE_DELTA) < USER_LOCATION_LOCK_TOLERANCE &&
                            Math.abs(region.longitudeDelta - USER_LOCATION_LOCK_LONGITUDE_DELTA) < USER_LOCATION_LOCK_TOLERANCE;

                        if (!isRegionAtUserLocation) {
                            setIsLocked(false);
                        }
                    }

                    try {
                        const results = await Location.reverseGeocodeAsync({
                            latitude: region.latitude,
                            longitude: region.longitude,
                        });

                        if (results.length > 0) {
                            const name = results[0].city || results[0].subregion || results[0].region || results[0].country || "Earth";
                            onAreaNameChange?.(name);
                        } else {
                            onAreaNameChange?.("Earth");
                        }
                    } catch (err) {
                        console.warn("Reverse geocoding failed", err);
                        onAreaNameChange?.("Earth");
                    }
                }}
                rotateEnabled={false}
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
                            radius={userRadius}
                            strokeWidth={2}
                            strokeColor="#6b2367"
                            fillColor="rgba(107, 35, 103, 0.2)"
                        />
                    </>
                )}
                {SHOW_FETCHING_GRIDS_DEBUG_OVERLAY && fetchingGridCount > 0 && (
                    Array.from(fetchingGrids.current).map((gridKey, index) => {
                        const [latGrid, lonGrid] = gridKey.split(",").map(Number);
                        const grid = {
                            north: latGrid * GRID_SIZE + GRID_SIZE,
                            south: latGrid * GRID_SIZE,
                            east: lonGrid * GRID_SIZE + GRID_SIZE,
                            west: lonGrid * GRID_SIZE,
                        };
                        return (
                            <Polygon
                                key={index}
                                coordinates={[
                                    { latitude: grid.north, longitude: grid.west },
                                    { latitude: grid.north, longitude: grid.east },
                                    { latitude: grid.south, longitude: grid.east },
                                    { latitude: grid.south, longitude: grid.west },
                                ]}
                                strokeColor="#FF0000"
                                fillColor="rgba(255, 0, 0, 0.1)"
                                strokeWidth={2}
                            />
                        );
                    })
                )}
                <Clusterer
                    data={pointFeatures}
                    mapDimensions={{ width, height }}
                    region={region}
                    renderItem={(item) => {
                        return item.properties.cluster ? (
                            <LocalityCluster key={item.properties.cluster_id} clusterFeature={item} mapRef={mapRef} />
                        ) : (
                            <LocalityMarker key={item.properties.id} pointFeature={item} />
                        );
                    }}
                />
            </MapView>
        </View>
    );
});

const styles = StyleSheet.create({
    userLocationContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    userLocationDot: {
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: "#6b2367",
        borderWidth: 2,
        borderColor: "white",
    },
});