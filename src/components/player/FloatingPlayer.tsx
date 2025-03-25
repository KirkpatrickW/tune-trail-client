import { usePlayer } from "@/context/PlayerContext";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import FastImage from "react-native-fast-image";
import { MovingText } from "../MovingText";
import { PlayPauseButton } from "./PlayerControls";
import { PlayerProgressBar } from "./PlayerProgressBar";

export const FloatingPlayer = () => {
    const { currentLocality, currentTrack, isSessionActive, toggleSession } = usePlayer();
    const router = useRouter();
    const [isPlayerLoading, setIsPlayerLoading] = useState(false);
    const [shouldRender, setShouldRender] = useState(isSessionActive);

    const sessionAnim = useRef(new Animated.Value(isSessionActive ? 1 : 0)).current;

    useEffect(() => {
        if (isSessionActive) {
            setShouldRender(true);
            Animated.timing(sessionAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(sessionAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setShouldRender(false);
            });
        }
    }, [isSessionActive]);

    const playerTranslateY = sessionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0],
    });

    const globeTranslateY = sessionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 100],
    });

    const handleGoToLocality = () => {
        if (!currentLocality) return;
        router.push({
            pathname: "/localities/[id]",
            params: {
                id: currentLocality.locality_id,
                name: currentLocality.name,
            },
        });
    };

    return (
        <View style={styles.container}>
            {(!isSessionActive || shouldRender) && (
                <Animated.View style={[styles.animatedWrapper, { transform: [{ translateY: globeTranslateY }] }]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.playerContainer, { width: 70, borderRadius: 35 }]}
                        onPress={async () => {
                            setIsPlayerLoading(true);
                            await toggleSession();
                            setIsPlayerLoading(false);
                        }}
                    >
                        {!isPlayerLoading ? (
                            <FontAwesome name="globe" size={55} color="#FFF" />
                        ) : (
                            <ActivityIndicator size="large" color="#FFF" />
                        )}
                    </TouchableOpacity>
                </Animated.View>
            )}

            {shouldRender && (
                <>
                    <Animated.View style={[styles.animatedWrapper, { transform: [{ translateY: playerTranslateY }] }]}>
                        <TouchableOpacity activeOpacity={0.9} style={styles.locationContainer} onPress={handleGoToLocality}>
                            <View style={styles.locationContent}>
                                <View style={styles.textWrapper}>
                                    <Text style={styles.localityLabel}>PLAYING FROM:</Text>
                                    <View style={styles.localityText}>
                                        <MovingText
                                            text={currentLocality?.name || ''}
                                            animationThreshold={15}
                                            style={styles.localityTextStyle}
                                        />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[styles.animatedWrapper, { transform: [{ translateY: playerTranslateY }] }]}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.playerContainer, { width: 375, borderRadius: 10 }]}
                            onPress={() => router.navigate("/player")}
                        >
                            <View style={styles.playerContent}>
                                <FastImage
                                    source={{
                                        uri:
                                            currentTrack?.cover.small ||
                                            currentTrack?.cover.medium ||
                                            currentTrack?.cover.large,
                                    }}
                                    style={styles.albumArt}
                                />
                                <View style={styles.textContainer}>
                                    <View style={styles.titleWrapper}>
                                        <MovingText
                                            text={currentTrack?.name || ''}
                                            animationThreshold={20}
                                            style={styles.songName}
                                        />
                                    </View>
                                    <View style={styles.titleWrapper}>
                                        <MovingText
                                            text={currentTrack?.artists.join(", ") || ''}
                                            animationThreshold={22}
                                            style={styles.artistName}
                                        />
                                    </View>
                                </View>
                                <View style={styles.iconGroup}>
                                    <PlayPauseButton style={styles.iconWrapper} iconSize={20} />
                                    <Pressable onPress={toggleSession} style={styles.iconWrapper}>
                                        <FontAwesome name="stop" size={20} color="#FFF" />
                                    </Pressable>
                                </View>
                            </View>
                            <PlayerProgressBar style={styles.progressBarWrapper} displayOnly={true} />
                        </TouchableOpacity>
                    </Animated.View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        left: 8,
        right: 8,
        bottom: 10,
    },
    animatedWrapper: {
        position: "absolute",
        bottom: 20,
    },
    playerContainer: {
        backgroundColor: "#6b2367",
        height: 70,
        justifyContent: "center",
        alignItems: "center",
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
        height: 105,
        width: 375,
        borderRadius: 10,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 5,
    },
    locationContent: {
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    textWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    localityLabel: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "bold",
        opacity: 0.6,
    },
    localityText: {
        marginLeft: 10,
        flexShrink: 1,
        overflow: "hidden",
    },
    localityTextStyle: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    albumArt: {
        width: 50,
        height: 50,
        borderRadius: 5,
    },
    textContainer: {
        flex: 1,
        marginLeft: 10,
        justifyContent: "center",
        overflow: "hidden",
    },
    titleWrapper: {
        height: 22,
        overflow: "hidden",
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
        flex: 0,
        paddingRight: 5,
    },
    iconWrapper: {
        marginLeft: 15,
    },
    progressBarWrapper: {
        position: "absolute",
        bottom: 0,
        left: 10,
        right: 10,
    },
});
