import { usePlayer } from "@/context/PlayerContext";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";

const RadiusSlider = () => {
    const { radius, setRadius } = usePlayer();

    const [isExpanded, setIsExpanded] = useState(false);

    const progress = useSharedValue(radius);
    const minimumValue = useSharedValue(100);
    const maximumValue = useSharedValue(10000);

    const animatedHeight = useState(new Animated.Value(0))[0];
    const animatedOpacity = useState(new Animated.Value(0))[0];

    const toggleSlider = () => {
        Animated.parallel([
            Animated.timing(animatedHeight, {
                toValue: isExpanded ? 0 : 200,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(animatedOpacity, {
                toValue: isExpanded ? 0 : 1,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();

        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={toggleSlider} style={styles.toggleButton} activeOpacity={0.9}>
                <FontAwesome6 name={isExpanded ? "xmark" : "ruler"} size={18} color="white" />
            </TouchableOpacity>

            <Animated.View style={[styles.sliderWrapper, { height: animatedHeight, opacity: animatedOpacity }]}>
                <View style={styles.rotatedSlider}>
                    <Slider
                        progress={progress}
                        minimumValue={minimumValue}
                        maximumValue={maximumValue}
                        onValueChange={(val: number) => {
                            setRadius(val);
                            progress.value = val;
                        }}
                        containerStyle={styles.sliderContainer}
                        theme={{
                            minimumTrackTintColor: '#6b2367',
                            maximumTrackTintColor: '#171717',
                        }}
                        renderThumb={() => null}
                        renderBubble={() => (
                            <View style={styles.bubbleContainer}>
                                <Text style={styles.bubbleText}>{`${Math.round(radius)}m`}</Text>
                            </View>
                        )}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    toggleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#171717",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1,
    },
    sliderWrapper: {
        position: 'absolute',
        top: 50,
        width: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    rotatedSlider: {
        transform: [{ rotate: "-90deg" }],
        width: 200,
        height: 40,
    },
    sliderContainer: {
        flex: 1,
        marginHorizontal: 10,
        borderRadius: 30,
    },
    bubbleContainer: {
        backgroundColor: "#6b2367",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 30,
        transform: [{ rotate: "90deg" }],
        borderWidth: 2,
        borderColor: "#ffffff",
    },
    bubbleText: {
        color: "white",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 12,
    },
});

export default RadiusSlider;
