import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BACKGROUND_COLOR = "#6b2367";

const DEFAULT_WIDTH = 70;
const PLAYER_WIDTH = 375;

const DEFAULT_BORDER_RADIUS = 35;
const PLAYER_BORDER_RADIUS = 10;

const LOCATION_HEIGHT = DEFAULT_WIDTH * 1.5;

const TRANSITION_DURATION = 300;

export const FloatingPlayer = () => {
    const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
    const router = useRouter();

    const [isPlayerToggleDisabled, setIsPlayerToggleDisabled] = useState(false);
    const [isPlayerActive, setIsPlayerActive] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const animWidth = useRef(new Animated.Value(DEFAULT_WIDTH)).current;
    const animBorderRadius = useRef(new Animated.Value(DEFAULT_BORDER_RADIUS)).current;
    const animLocationHeight = useRef(new Animated.Value(DEFAULT_WIDTH)).current;
    const animContentOpacity = useRef(new Animated.Value(1)).current;

    const animatePlayerToggle = (width: number, borderRadius: number) => {
        const initialPlayerState = isPlayerActive;

        // Introducing a small timeout (1ms) to ensure proper sequencing of animations.
        // This ensures that React Native's Animated API processes the opacity animations correctly
        // after the layout and state updates have been processed, avoiding potential conflicts
        // with simultaneous animations (e.g., opacity change not taking effect).
        setTimeout(() => {
            Animated.timing(animContentOpacity, {
                toValue: 0,
                duration: TRANSITION_DURATION,
                delay: 100,
                useNativeDriver: false,
            }).start(() => {
                Animated.parallel([
                    Animated.timing(animWidth, {
                        toValue: width,
                        duration: TRANSITION_DURATION,
                        useNativeDriver: false,
                    }),
                    Animated.timing(animLocationHeight, {
                        toValue: initialPlayerState ? DEFAULT_WIDTH : LOCATION_HEIGHT,
                        duration: TRANSITION_DURATION,
                        useNativeDriver: false,
                    }),
                    Animated.timing(animBorderRadius, {
                        toValue: borderRadius,
                        duration: TRANSITION_DURATION,
                        useNativeDriver: false,
                    }),
                ]).start(() => {
                    setIsPlayerActive(prevState => !prevState);
                    setIsPlayerToggleDisabled(false);
    
                    setTimeout(() => {
                        Animated.timing(animContentOpacity, {
                            toValue: 1,
                            duration: TRANSITION_DURATION,
                            delay: 100,
                            useNativeDriver: false,
                        }).start();
                    }, 1);
                });
            });
        }, 1);
    };

    const togglePlayer = () => {
        setIsPlayerToggleDisabled(true);
        if (isPlayerActive) {
            animatePlayerToggle(DEFAULT_WIDTH, DEFAULT_BORDER_RADIUS);
        } else {
            animatePlayerToggle(PLAYER_WIDTH, PLAYER_BORDER_RADIUS);
        }
    };

    const handlePlayerPress = () => {
        if (isPlayerActive) {
            router.navigate('/player');
        } else {
            togglePlayer();
        }
    }

    const togglePlayPause = () => {
        setIsMusicPlaying((prevState) => !prevState);
    };

    return (
        <View style={styles.container}>
            <AnimatedTouchableOpacity activeOpacity={0.9} disabled={isPlayerToggleDisabled} style={[styles.locationContainer, { width: animWidth, height: animLocationHeight, borderRadius: animBorderRadius}]}>
                {isPlayerActive && (
                    <Animated.View style={[styles.locationContent, { opacity: animContentOpacity }]}>
                        <View style={styles.textWrapper}>
                            <Text style={styles.playlistLabel}>PLAYING FROM:</Text>
                            <Text style={styles.playlist}>Ballyclare</Text>
                        </View>
                    </Animated.View>
                )}
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity activeOpacity={0.9} onPress={handlePlayerPress} disabled={isPlayerToggleDisabled} style={[styles.playerContainer, { width: animWidth, borderRadius: animBorderRadius}]}>
                <Animated.View style={{ opacity: animContentOpacity }}>
                    {!isPlayerActive ? (
                        <FontAwesome name="globe" size={55} color="#FFF" />
                    ) : (
                        <View style={styles.playerContent}>
                            <Image
                                source={{
                                    uri: "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Dare-cover.png/220px-Dare-cover.png",
                                }}
                                style={styles.albumArt}/>
                            <View style={styles.textContainer}>
                                <Text style={styles.songName}>Don't You Want Me</Text>
                                <Text style={styles.artistName}>The Human League</Text>
                            </View>
                            <View style={styles.iconGroup}>
                                <Pressable onPress={togglePlayPause} style={styles.iconWrapper}>
                                    <FontAwesome name={isMusicPlaying ? "pause" : "play"} size={20} color="#FFF" />
                                </Pressable>
                                <Pressable onPress={togglePlayer} style={styles.iconWrapper} disabled={isPlayerToggleDisabled}>
                                    <FontAwesome name="stop" size={20} color="#FFF" />
                                </Pressable>
                            </View>
                        </View>
                    )} 
                </Animated.View>
            </AnimatedTouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
    },
    playerContainer: {
        backgroundColor: BACKGROUND_COLOR,
        height: DEFAULT_WIDTH,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        bottom: 40,
    },
    playerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 10,
    },
    locationContainer: {
        backgroundColor: "#171717",
        height: DEFAULT_WIDTH,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        bottom: 40,
    },
    locationContent: {
        width: "100%",
        position: "absolute",
        top: 5,
        alignItems: "center",
    },
    textWrapper: {
        flexDirection: "row",
        justifyContent: "flex-start", 
        alignItems: "center",
    },
    playlistLabel: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "bold",
        opacity: 0.6,
    },
    playlist: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
    },
    albumArt: {
        width: 50,
        height: 50,
        borderRadius: 5,
    },
    textContainer: {
        marginLeft: 10,
        justifyContent: "center",
    },
    songName: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    artistName: {
        color: "#FFF",
        fontSize: 14,
        opacity: 0.6,
    },
    iconGroup: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        flex: 1,
        paddingRight: 5,
    },
    iconWrapper: {
        marginLeft: 15,
    },
})