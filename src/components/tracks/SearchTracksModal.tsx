import { localitiesService } from '@/api/localitiesService';
import { tracksService } from '@/api/tracksService';
import { TrackType } from '@/api/types/searchTracksResponse';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome6 } from "@expo/vector-icons";
import axios, { CancelTokenSource } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

interface LocalityDetails {
    localityId: string;
    name: string;
    existingSpotifyTrackIds: string[];
}

interface SearchTracksModalProps {
    isVisible: boolean;
    onClose: () => void;
    onTrackAdded: () => void;
    localityDetails: LocalityDetails;
}

export const SearchTracksModal = ({ isVisible, onClose, onTrackAdded, localityDetails }: SearchTracksModalProps) => {
    const { localityId, name, existingSpotifyTrackIds } = localityDetails;

    const [searchText, setSearchText] = useState("");
    const [tracks, setTracks] = useState<TrackType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingTrack, setLoadingTrack] = useState<string | null>(null);

    const { isAuthenticated } = useAuth();
    const cancelTokenSourceRef = useRef<CancelTokenSource | null>(null);

    const fetchTracks = async () => {
        if (!hasMore) return;

        cancelTokenSourceRef.current = axios.CancelToken.source();
        if (!isLoading) setIsLoading(true);

        try {
            const searchTrackResponse = await tracksService.searchTracks(
                searchText,
                nextOffset,
                cancelTokenSourceRef.current
            );
            const { next_offset, total_matching_results, results } = searchTrackResponse.data;

            setTracks((prev) => [...prev, ...results]);
            setHasMore(next_offset < total_matching_results);
            setNextOffset(next_offset);
        } catch (error) {
            return;
        }
        setIsLoading(false);
    };

    const handleAddTrack = async (track: TrackType) => {
        const track_spotify_id = track.spotify_id;

        setLoadingTrack(track_spotify_id);

        try {
            await localitiesService.addTrackToLocality(localityId, track_spotify_id);
            onTrackAdded();
            closeModal();
        } catch (error) {
            setLoadingTrack(null);
        }
    };

    const resetSearchState = () => {
        if (cancelTokenSourceRef.current) cancelTokenSourceRef.current.cancel();
        setTracks([]);
        setNextOffset(0);
        setHasMore(true);
    };

    const clearSearch = () => {
        resetSearchState();
        setSearchText("");
    };

    const handleSearchChange = (input: string) => {
        resetSearchState();
        setSearchText(input);

        if (input.length === 0) {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (searchText.length > 0) {
            fetchTracks();
        }
    }, [searchText]);

    const screenHeight = Dimensions.get('window').height;
    const modalHeight = screenHeight * 0.85;

    const slideAnim = useRef(new Animated.Value(modalHeight)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible && isAuthenticated) {
            openModal();
        } else {
            onClose();
        }
    }, [isVisible]);

    const openModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: modalHeight,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setLoadingTrack(null);
            clearSearch();
            onClose();
        });
    };

    if (!isVisible) return null;

    return (
        <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={closeModal} disabled={isLoading}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View style={{ height: '85%', transform: [{ translateY: slideAnim }] }}>
                <View style={styles.topBar}>
                    <View style={styles.searchWrapper}>
                        <View style={styles.searchContainer}>
                            <FontAwesome6 name="magnifying-glass" size={18} color="#a1a1a1" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="What do you want to add?"
                                value={searchText}
                                onChangeText={handleSearchChange}
                                placeholderTextColor="#a1a1a1"
                                selectionColor="#6b2367"
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                                    <FontAwesome6 name="xmark" size={18} color="#a1a1a1" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity onPress={closeModal} style={styles.cancelButton} disabled={isLoading}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.flatListContentContainer}>
                    <FlatList
                        data={tracks}
                        ListEmptyComponent={
                            <View style={styles.flatListEmptyContainer}>
                                {isLoading ? (
                                    <ActivityIndicator size="large" color="#fff" />
                                ) : (
                                    <View style={styles.flatListTextContainer}>
                                        <Text style={styles.flatListTitle}>Add what they love</Text>
                                        <Text style={styles.flatListSubtitle}>Search for tracks that make {name}, {name}!</Text>
                                    </View>
                                )}
                            </View>
                        }
                        indicatorStyle="white"
                        keyExtractor={(item) => item.spotify_id}
                        renderItem={({ item }) => (
                            <View style={styles.trackItem}>
                                <FastImage
                                    source={{ uri: item.cover.small || item.cover.medium || item.cover.large }}
                                    style={styles.trackImage}
                                />
                                <View style={styles.trackInfo}>
                                    <Text style={styles.trackTitle} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.trackArtist} numberOfLines={1}>
                                        {item.artists.join(", ")}
                                    </Text>
                                </View>
                                <View style={styles.addTrackButtonWrapper}>
                                    {loadingTrack === item.spotify_id ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : existingSpotifyTrackIds.includes(item.spotify_id) ? (
                                        <View style={styles.addedTrackButton}>
                                            <FontAwesome6 name="check" size={12} color="#fff" />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => handleAddTrack(item)}
                                            style={styles.addTrackButton}
                                            disabled={!!loadingTrack}
                                        >
                                            <FontAwesome6 name="plus" size={12} color="#fff" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                        ListFooterComponent={
                            isLoading && tracks.length > 0 ? (
                                <ActivityIndicator size="large" color="#fff" style={{ padding: 24 }} />
                            ) : null
                        }
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: tracks.length > 0 ? 175 : 0 }}
                        onEndReached={() => {
                            if (!isLoading && tracks.length > 0) {
                                fetchTracks();
                            }
                        }}
                        onEndReachedThreshold={0.2}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    topBar: {
        backgroundColor: "#242424",
        elevation: 10,
        padding: 10,
        paddingHorizontal: 24,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    searchWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#313131",
        borderRadius: 30,
        paddingHorizontal: 10,
        height: 35,
        flex: 1,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#fff",
    },
    clearButton: {
        padding: 5,
    },
    cancelButton: {
        marginLeft: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    cancelText: {
        color: "white",
        fontSize: 16,
    },
    trackItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#333",
        justifyContent: "space-between",
    },
    trackImage: {
        width: 50,
        height: 50,
        borderRadius: 5,
        marginRight: 10,
    },
    trackInfo: {
        flex: 1,
    },
    trackTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    trackArtist: {
        color: "#a1a1a1",
        fontSize: 14,
    },
    addTrackButtonWrapper: {
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    addTrackButton: {
        width: 20,
        height: 20,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        borderColor: "white",
        borderWidth: 1.5,
    },
    addedTrackButton: {
        width: 20,
        height: 20,
        borderRadius: 20,
        backgroundColor: "#6b2367",
        justifyContent: "center",
        alignItems: "center",
    },
    flatListContentContainer: {
        backgroundColor: "#171717",
        flex: 1,
        paddingHorizontal: 24,
    },
    flatListEmptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flatListTextContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    flatListTitle: {
        fontSize: 24,
        color: "#fff",
        fontWeight: "bold",
    },
    flatListSubtitle: {
        fontSize: 16,
        color: "#fff",
        opacity: 0.6,
        textAlign: "center",
        maxWidth: 300,
    },
});
