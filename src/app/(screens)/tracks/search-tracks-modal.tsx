import { defaultStyles } from '@/styles';
import { FontAwesome6 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import FastImage from 'react-native-fast-image';

type TrackType = {
    spotify_id: string;
    deezer_id: string;
    isrc: string;
    name: string;
    artists: string[];
    cover: {
        small?: string;
        medium?: string;
        large?: string;
    };
    preview_url?: string;
};

const SearchModal = () => {
    const { name } = useLocalSearchParams();
    const router = useRouter();
    const [searchText, setSearchText] = useState("");
    const [tracks, setTracks] = useState<TrackType[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const controllerRef = useRef<AbortController | null>(null);

    const fetchTracks = async () => {
        if (!hasMore) return;

        controllerRef.current = new AbortController();
        if (!loading) setLoading(true);

        try {
            const response = await fetch(
                `http://10.0.2.2:8000/tracks/search?q=${encodeURIComponent(searchText)}&offset=${nextOffset}`,
                { signal: controllerRef.current.signal }
            );
            const { next_offset, total_matching_results, data } = await response.json();

            setTracks(prev => [...prev, ...data]);
            setHasMore(next_offset < total_matching_results);
            setNextOffset(next_offset);
        } catch (error) {
            return;
        }
        setLoading(false);
    };

    const resetSearchState = () => {
        if (controllerRef.current) controllerRef.current.abort();
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
    };

    useEffect(() => {
        if (searchText.length > 0) {
            fetchTracks();
        }
    }, [searchText]);

    return (
        <View style={styles.overlayContainer}>
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.contentContainer}>
                {searchText.length === 0 ? (
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Add what they love</Text>
                        <Text style={styles.subtitle}>Search for tracks that make {name}, {name}!</Text>
                    </View>
                ) : (
                    <FlatList
                        data={tracks}
                        indicatorStyle='white'
                        keyExtractor={(item) => item.spotify_id}
                        renderItem={({ item }) => (
                            <View style={styles.trackItem}>
                                <FastImage source={{ uri: item.cover.small }} style={styles.trackImage} />
                                <View>
                                    <Text style={styles.trackTitle}>{item.name}</Text>
                                    <Text style={styles.trackArtist}>{item.artists.join(", ")}</Text>
                                </View>
                            </View>
                        )}
                        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#fff" style={{ padding: 24 }} /> : null}
                        contentContainerStyle={{ paddingBottom: 150 }}
                        onEndReached={() => {
                            if (!loading) {
                                fetchTracks();
                            }
                        }}
                        onEndReachedThreshold={0.5}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        ...defaultStyles.container,
        paddingTop: "20%",
    },
    topBar: {
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#242424",
        elevation: 10,
        padding: 10,
        paddingHorizontal: 24,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    contentContainer: {
        backgroundColor: "#171717",
        flex: 1,
        paddingHorizontal: 24,
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
    },
    trackImage: {
        width: 50,
        height: 50,
        borderRadius: 5,
        marginRight: 10,
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
    textContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        color: "#fff",
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 16,
        color: "#a1a1a1",
        textAlign: "center",
        maxWidth: 300,
    },
});

export default SearchModal;
