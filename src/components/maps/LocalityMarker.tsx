import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { supercluster } from "react-native-clusterer";
import { Marker } from "react-native-maps";

type LocalityMarkerProps = {
    pointFeature: supercluster.PointFeature<any>;
    index: number;
};

export const LocalityMarker = ({ pointFeature, index }: LocalityMarkerProps) => {
    const hasTracks = pointFeature.properties.track_count > 0;
    const trackCount = pointFeature.properties.track_count;
    const trackCountDisplay = trackCount > 99 ? "99+" : trackCount.toString();

    const containerStyle = hasTracks
        ? styles.localityWithTracksContainer
        : styles.localityNoTracksContainer;

    const textStyle = hasTracks
        ? styles.localityWithTracksText
        : styles.localityNoTracksText;

    return (
        <Marker
            onPress={() => {
                router.push({
                    pathname: "/localities/[id]",
                    params: {
                        id: pointFeature.properties.id,
                        name: pointFeature.properties.name,
                        longitude: pointFeature.geometry.coordinates[0],
                        latitude: pointFeature.geometry.coordinates[1]
                    }
                });
            }}
            key={index}
            coordinate={{
                longitude: pointFeature.geometry.coordinates[0],
                latitude: pointFeature.geometry.coordinates[1],
            }}
        >
            <View style={styles.markerContainer}>
                <View style={containerStyle}>
                    <Text style={textStyle}>{pointFeature.properties.name}</Text>
                    {hasTracks && (
                        <View style={styles.trackCountBadge}>
                            <Text style={styles.trackCountBadgeText}>{trackCountDisplay}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Marker>
    );
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        position: "relative",
    },
    localityWithTracksContainer: {
        backgroundColor: "#6b2367",
        padding: 5,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 20,
    },
    localityNoTracksContainer: {
        backgroundColor: "#171717",
        padding: 5,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 20,
    },
    localityWithTracksText: {
        fontSize: 12,
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white",
    },
    localityNoTracksText: {
        fontSize: 10,
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white",
    },
    trackCountBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#171717',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: "white",
    },
    trackCountBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
