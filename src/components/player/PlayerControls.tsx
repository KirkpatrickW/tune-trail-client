import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import TrackPlayer, { useIsPlaying } from "react-native-track-player";

type PlayerControlsProps = {
    style?: ViewStyle
}

type PlayerButtonProps = {
    style?: ViewStyle
    iconSize?: number
}

export const PlayerControls = ({ style }: PlayerControlsProps) => {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.row}>
                <SkipToPreviousButton />

                <PlayPauseButton />

                <SkipToNextButton />
			</View>
		</View>
	)
}

export const PlayPauseButton = ({style, iconSize = 48 }: PlayerButtonProps) => {
    const {playing} = useIsPlaying();

    return <View style={[style, {height: iconSize}]}>
        <TouchableOpacity activeOpacity={0.9} onPress={playing ? TrackPlayer.pause : TrackPlayer.play}>
            <FontAwesome name={playing ? "pause" : "play"} size={iconSize} color="#FFF" />
        </TouchableOpacity>
    </View>
}

export const SkipToNextButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	return (
		<TouchableOpacity activeOpacity={0.9} onPress={() => TrackPlayer.skipToNext()}>
			<FontAwesome6 name="forward" size={iconSize} color="#FFF" />
		</TouchableOpacity>
	)
}

export const SkipToPreviousButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	return (
		<TouchableOpacity activeOpacity={0.9} onPress={() => TrackPlayer.skipToPrevious()}>
			<FontAwesome6 name="backward" size={iconSize} color="#FFF" />
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		alignItems: "center",
	},
})