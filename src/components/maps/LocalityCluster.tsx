import { StyleSheet, Text, View } from "react-native";
import { supercluster } from "react-native-clusterer";
import { Marker } from "react-native-maps";

type LocalityClusterProps = {
    clusterFeature: supercluster.ClusterFeature<any>;
    index: number;
};

export const LocalityCluster = ({ clusterFeature, index }: LocalityClusterProps) => {
    return (
        <Marker
            key={index}
            coordinate={{
                latitude: clusterFeature.geometry.coordinates[1],
                longitude: clusterFeature.geometry.coordinates[0],
            }}
            onPress={() => { alert(`Cluster with ${clusterFeature.properties.point_count} points`) }}
        >
            <View style={styles.clusterContainer}>
                <Text style={styles.clusterText}>
                    {clusterFeature.properties.point_count}
                </Text>
            </View>
        </Marker>
    );
};

const styles = StyleSheet.create({
    clusterContainer: {
        backgroundColor: "#6b2367",
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
