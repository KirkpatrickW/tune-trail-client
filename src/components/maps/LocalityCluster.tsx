import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { supercluster } from "react-native-clusterer";
import MapView, { Marker } from "react-native-maps";

type LocalityClusterProps = {
    clusterFeature: supercluster.ClusterFeature<any>;
    mapRef: React.RefObject<MapView>;
};

export const LocalityCluster = React.memo(({ clusterFeature, mapRef }: LocalityClusterProps) => {
    const handleClusterPress = () => {
        const expansionRegion = clusterFeature.properties.getExpansionRegion();

        if (mapRef.current) {
            mapRef.current.animateToRegion(expansionRegion, 1000);
        }
    };

    return (
        <Marker
            testID="cluster-marker"
            coordinate={{
                latitude: clusterFeature.geometry.coordinates[1],
                longitude: clusterFeature.geometry.coordinates[0],
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={handleClusterPress}>
            <View testID="cluster-container" style={styles.clusterContainer}>
                <Text style={styles.clusterText}>
                    {clusterFeature.properties.point_count}
                </Text>
            </View>
        </Marker>
    );
}, (prevProps, nextProps) =>
    prevProps.clusterFeature === nextProps.clusterFeature
);

const styles = StyleSheet.create({
    clusterContainer: {
        backgroundColor: "#421d40",
        padding: 5,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "white",
        width: 40,
        height: 40,
    },
    clusterText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "white",
    },
});