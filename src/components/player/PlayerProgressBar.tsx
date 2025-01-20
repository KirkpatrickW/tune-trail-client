import { colors } from "@/constants/tokens";
import { formatSecondsToMinutes } from "@/helpers/miscellaneous";
import { utilsStyles } from "@/styles";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Slider } from "react-native-awesome-slider";
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import TrackPlayer, { useProgress } from "react-native-track-player";

type PlayerProgressBarProps = {
    style?: ViewStyle
    displayOnly?: boolean
}

export const PlayerProgressBar = ({ style, displayOnly = false }: PlayerProgressBarProps) => {
    const { duration, position } = useProgress(250);

    const isSliding = useSharedValue(false);
    const min = useSharedValue(0);
    const max = useSharedValue(1);

    const progress: SharedValue<number> = useDerivedValue(() => {
        if (isSliding.value || duration === 0) {
            return 0;
        }
        return position / duration;
    });

    const trackElapsedTime = formatSecondsToMinutes(position);
    const trackRemainingTime = formatSecondsToMinutes(duration - position);

    return (
        <View style={style}>
            {displayOnly ? (
                <View style={[styles.progressBar, { backgroundColor: colors.maximumTrackTintColor }]}>
                    <Animated.View style={[styles.progress, useAnimatedStyle(() => { return { width: `${progress.value * 100}%` } }) ]} />
                </View>
            ) : (
                <>
                    <Slider
                        progress={progress}
                        minimumValue={min}
                        maximumValue={max}
                        containerStyle={utilsStyles.slider}
                        thumbWidth={0}
                        renderBubble={() => null}
                        theme={{
                            minimumTrackTintColor: colors.minimumTrackTintColor,
                            maximumTrackTintColor: colors.maximumTrackTintColor,
                        }}
                        onSlidingStart={() => {
                            isSliding.value = true;
                        }}
                        onValueChange={async (value) => {
                            await TrackPlayer.seekTo(value * duration);
                        }}
                        onSlidingComplete={async (value) => {
                            if (!isSliding.value) return;

                            isSliding.value = false;
                            await TrackPlayer.seekTo(value * duration);
                        }}
                    />

                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{trackElapsedTime}</Text>
                        <Text style={styles.timeText}>
                            {"-"} {trackRemainingTime}
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    progressBar: {
        height: 4,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: colors.minimumTrackTintColor,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginTop: 10,
    },
	timeText: {
		color: "#fff",
		opacity: 0.75,
		fontSize: 12,
		letterSpacing: 0.7,
		fontWeight: '500',
	}
});
