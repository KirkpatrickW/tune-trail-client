import { FontAwesome6 } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { MovingText } from "../MovingText";

type LocationControlsProps = {
    style?: ViewStyle
}

export const LocationControls = ({ style }: LocationControlsProps) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.row}>
                <TouchableOpacity activeOpacity={0.9} style={{ paddingRight: 24 }}>
                    <FontAwesome6 name="backward" size={30} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.9} style={styles.locationContainer}>
                    <Text style={styles.locationLabel}>PLAYING FROM:</Text>
                    <View style={{ maxWidth: '100%', overflow: "hidden" }}>
                        <MovingText
                            text="Ballyclare"
                            animationThreshold={20}
                            style={styles.locationTitle}
                        />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.9} style={{ paddingLeft: 24 }}>
                    <FontAwesome6 name="forward" size={30} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    locationContainer: {
		flex: 1,
        alignItems: "center",
	},
    locationTitle: {
        color: '#fff',
		fontSize: 22,
		fontWeight: '700',
	},
    locationLabel: {
		color: '#fff',
		fontSize: 12,
		opacity: 0.8,
	},
})
