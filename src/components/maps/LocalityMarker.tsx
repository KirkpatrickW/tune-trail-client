import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { supercluster } from "react-native-clusterer";
import { Marker } from "react-native-maps";

type LocalityMarkerProps = {
    pointFeature: supercluster.PointFeature<any>;
    index: number;
};

export const LocalityMarker = ({ pointFeature, index }: LocalityMarkerProps) => {
    const isWithTracks = Math.random() < 0.5;

    const containerStyle = isWithTracks
        ? styles.localityWithTracksContainer
        : styles.localityNoTracksContainer;

    const textStyle = isWithTracks
        ? styles.localityWithTracksText
        : styles.localityNoTracksText;

    return (
        <Marker
            onPress={() => { router.push({
                pathname: "/localities/[id]",
                params: { 
                    id: pointFeature.properties.id,
                    name: pointFeature.properties.name
                }
            }) }}
            key={index}
            coordinate={{
                latitude: pointFeature.geometry.coordinates[1],
                longitude: pointFeature.geometry.coordinates[0],
            }}>
            <View style={containerStyle}>
                <Text style={textStyle}>{pointFeature.properties.name}</Text>
            </View>
        </Marker>
    );
};

const styles = StyleSheet.create({
    localityWithTracksContainer: {
        backgroundColor: "#6b2367",
        padding: 5,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 20
    },
    localityNoTracksContainer: {
        backgroundColor: "#171717",
        padding: 5,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 20
    },
    localityWithTracksText: {
        fontSize: 12,
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white"
    },
    localityNoTracksText: {
        fontSize: 10,
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white"
    }
});
