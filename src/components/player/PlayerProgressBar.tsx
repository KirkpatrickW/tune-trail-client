import { usePlayer } from "@/context/PlayerContext";
import { utilsStyles } from "@/styles";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Slider } from "react-native-awesome-slider";
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";

type PlayerProgressBarProps = {
    style?: ViewStyle
    displayOnly?: boolean
}

export const PlayerProgressBar = ({ style, displayOnly = false }: PlayerProgressBarProps) => {
    const { trackDuration, playbackPosition, seekToPosition } = usePlayer();

    const isSliding = useSharedValue(false);
    const min = useSharedValue(0);
    const max = useSharedValue(1);

    const progress: SharedValue<number> = useDerivedValue(() => {
        if (isSliding.value || trackDuration === 0) {
            return 0;
        }
        return playbackPosition / trackDuration;
    });

    const formatSecondsToMinutes = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)

        const formattedMinutes = String(minutes).padStart(2, '0')
        const formattedSeconds = String(remainingSeconds).padStart(2, '0')

        return `${formattedMinutes}:${formattedSeconds}`
    }

    const trackElapsedTime = formatSecondsToMinutes(playbackPosition);
    const trackRemainingTime = formatSecondsToMinutes(trackDuration - playbackPosition);

    return (
        <View style={style}>
            {displayOnly ? (
                <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
                    <Animated.View style={[styles.progress, useAnimatedStyle(() => { return { width: `${progress.value * 100}%` } })]} />
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
                            minimumTrackTintColor: 'rgba(255,255,255,0.6)',
                            maximumTrackTintColor: 'rgba(255,255,255,0.4)',
                        }}
                        onSlidingStart={() => {
                            isSliding.value = true;
                        }}
                        onValueChange={(value) => seekToPosition(value * trackDuration)}
                        onSlidingComplete={(value) => {
                            if (!isSliding.value) return;

                            isSliding.value = false;
                            seekToPosition(value * trackDuration);
                        }} />

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
        backgroundColor: 'rgba(255,255,255,0.4)',
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
