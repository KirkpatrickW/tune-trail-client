import { defaultStyles } from "@/styles";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PlayerScreen = () => {
    return (<View style={styles.overlayContainer}>
        <DismissPlayerSymbol/>
    </View>);
}

const DismissPlayerSymbol = () => {
    const {top} = useSafeAreaInsets()

    return (<View style={{
        position: "absolute",
        top: top + 8,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center"
    }}>
        <View accessible={false} style={{
            width: 50,
            height: 8,
            borderRadius: 8,
            backgroundColor: "white",
            opacity: 0.7
        }}/>
    </View>)
}

const styles = StyleSheet.create({
    overlayContainer: {
        ...defaultStyles.container,
        backgroundColor: "#6b2367"
    }

});

export default PlayerScreen;