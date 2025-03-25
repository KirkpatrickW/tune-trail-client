import { usePlayer } from "@/context/PlayerContext";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { PlayPauseButton } from "./PlayerControls";
import { PlayerProgressBar } from "./PlayerProgressBar";

export const FloatingPlayer = () => {
    const { currentLocality, currentTrack, isSessionActive, toggleSession } = usePlayer();
    const router = useRouter();

    const [isPlayerLoading, setIsPlayerLoading] = useState(false);

    return (
        <View style={styles.container}>
            {!isSessionActive ? (
                <TouchableOpacity activeOpacity={0.9} style={[styles.playerContainer, { width: 70, borderRadius: 35 }]} onPress={async () => {
                    setIsPlayerLoading(true);
                    await toggleSession();
                    setIsPlayerLoading(false);
                }}>
                    {!isPlayerLoading ? (
                        <FontAwesome name="globe" size={55} color="#FFF" />
                    ) : (
                        <ActivityIndicator size="large" color="#FFF" />
                    )}
                </TouchableOpacity>
            ) : (
                <>
                    <TouchableOpacity activeOpacity={0.9} style={styles.locationContainer}>
                        <View style={styles.locationContent}>
                            <View style={styles.textWrapper}>
                                <Text style={styles.playlistLabel}>PLAYING FROM:</Text>
                                <Text style={styles.playlist}>{currentLocality?.name}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.9} style={[styles.playerContainer, { width: 375, borderRadius: 10 }]} onPress={() => router.navigate('/player')}>
                        <View style={styles.playerContent}>
                            <FastImage
                                source={{ uri: currentTrack?.cover.small || currentTrack?.cover.medium || currentTrack?.cover.large }}
                                style={styles.albumArt} />
                            <View style={styles.textContainer}>
                                <Text style={styles.songName}>{currentTrack?.name}</Text>
                                <Text style={styles.artistName}>{currentTrack?.artists}</Text>
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
                </>
            )}
        </View>
    );
}

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
    playerContainer: {
        backgroundColor: "#6b2367",
        height: 70,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        bottom: 20,
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
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        bottom: 20,
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
    progressBarWrapper: {
        position: "absolute",
        bottom: 0,
        left: 10,
        right: 10,
    }
})