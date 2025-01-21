import { Locality } from "@/types/maps/locality.types";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

type LocalityMarkerProps = {
    locality: Locality
    index: number
}

export const LocalityMarker = ({ locality, index }: LocalityMarkerProps) => {
    return (
        <Marker
            onPress={() => { alert(locality.name) }}
            key={index}
            coordinate={{
                latitude: locality.latitude,
                longitude: locality.longitude,
            }}>
            <View style={styles.localityContainer}>
                <Text style={styles.localityText}>{locality.name}</Text>
            </View>
        </Marker>
    );
}

const styles = StyleSheet.create({
    localityContainer: {
        backgroundColor: "#6b2367",
        padding: 5,
        paddingHorizontal: 10,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 20
    },
    localityText: {
        textTransform: "uppercase",
        fontWeight: "bold",
        color: "white"
    }
});