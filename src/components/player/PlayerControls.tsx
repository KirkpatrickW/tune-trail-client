import { usePlayer } from "@/context/PlayerContext";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { MovingText } from "../misc/MovingText";

type PlayerControlsProps = {
	style?: ViewStyle
}

type PlayerButtonProps = {
	style?: ViewStyle
	iconSize?: number
}

export const PlayerTrackControls = ({ style }: PlayerControlsProps) => {
	return (
		<View testID="player-track-controls" style={[styles.container, style]}>
			<View style={styles.row}>
				<SkipToPreviousTrackButton />

				<PlayPauseButton />

				<SkipToNextTrackButton />
			</View>
		</View>
	)
}

export const PlayerLocalityControls = ({ style }: PlayerControlsProps) => {
	return (
		<View testID="player-locality-controls" style={[styles.container, style]}>
			<View style={styles.row}>
				<SkipToPreviousLocalityButton />

				<GoToLocalityButton />

				<SkipToNextLocalityButton />
			</View>
		</View>
	);
}

export const PlayPauseButton = ({ style, iconSize = 48 }: PlayerButtonProps) => {
	const { isPlaying, pause, resume } = usePlayer();

	return <View style={[style, { height: iconSize }]}>
		<TouchableOpacity testID="play-pause-button" activeOpacity={0.9} onPress={isPlaying ? pause : resume}>
			<FontAwesome name={isPlaying ? "pause" : "play"} size={iconSize} color="#FFF" />
		</TouchableOpacity>
	</View>
}

export const SkipToNextTrackButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	const { canSkipTrack, skipToNextTrack } = usePlayer();

	return (
		<TouchableOpacity testID="skip-next-track-button" activeOpacity={0.9} onPress={skipToNextTrack} disabled={!canSkipTrack} style={{ opacity: canSkipTrack ? 1 : 0.5 }}>
			<FontAwesome6 name="forward" size={iconSize} color="#FFF" />
		</TouchableOpacity>
	)
}

export const SkipToPreviousTrackButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	const { canSkipTrack, skipToPreviousTrack } = usePlayer();

	return (
		<TouchableOpacity testID="skip-previous-track-button" activeOpacity={0.9} onPress={skipToPreviousTrack} disabled={!canSkipTrack} style={{ opacity: canSkipTrack ? 1 : 0.5 }}>
			<FontAwesome6 name="backward" size={iconSize} color="#FFF" />
		</TouchableOpacity>
	)
}

export const GoToLocalityButton = () => {
	const { currentLocality } = usePlayer();
	const router = useRouter();

	if (!currentLocality) return null;

	return (
		<TouchableOpacity testID="go-to-locality-button" activeOpacity={0.9} style={{ flex: 1, alignItems: "center" }} onPress={() => {
			router.push({
				pathname: "/localities/[id]",
				params: {
					id: currentLocality.locality_id,
					name: currentLocality.name
				}
			});
		}}>
			<Text style={{ color: "#fff", fontSize: 12, opacity: 0.8 }}>PLAYING FROM:</Text>
			<View style={{ maxWidth: '100%', overflow: "hidden" }}>
				<MovingText
					text={currentLocality.name}
					animationThreshold={20}
					style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }} />
			</View>
		</TouchableOpacity>
	)
}

export const SkipToNextLocalityButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	const { canSkipLocality, skipToNextLocality } = usePlayer();

	return (
		<TouchableOpacity testID="skip-next-locality-button" activeOpacity={0.9} onPress={skipToNextLocality} disabled={!canSkipLocality} style={{ opacity: canSkipLocality ? 1 : 0.5 }}>
			<FontAwesome6 name="forward" size={iconSize} color="#FFF" />
		</TouchableOpacity>
	)
}

export const SkipToPreviousLocalityButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	const { canSkipLocality, skipToPreviousLocality } = usePlayer();

	return (
		<TouchableOpacity testID="skip-previous-locality-button" activeOpacity={0.9} onPress={skipToPreviousLocality} disabled={!canSkipLocality} style={{ opacity: canSkipLocality ? 1 : 0.5 }}>
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
	}
})