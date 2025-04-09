import { userService } from '@/api/userService';
import { useAuth } from '@/context/AuthContext';
import { UserType } from '@/types/api/searchUsersResponse';
import { FontAwesome } from "@expo/vector-icons";
import axios, { CancelTokenSource } from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ManageUsersScreen = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isAdmin } = useAuth();

    const [searchText, setSearchText] = useState("");
    const [users, setUsers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    const [processingAction, setProcessingAction] = useState<{ userId: number, action: 'invalidate' | 'delete' } | null>(null);

    const cancelTokenSourceRef = React.useRef<CancelTokenSource | null>(null);

    const fetchUsers = async () => {
        if (!hasMore) return;

        cancelTokenSourceRef.current = axios.CancelToken.source();
        if (!isLoading) setIsLoading(true);

        try {
            const response = await userService.searchUsers(
                searchText,
                nextOffset,
                cancelTokenSourceRef.current
            );
            const { next_offset, users } = response.data;

            setUsers((prev) => [...prev, ...users]);
            setHasMore(next_offset == null);
            setNextOffset(next_offset != null ? next_offset : 0);
            setHasSearched(true);
        } catch (error) {
            return;
        }
        setIsLoading(false);
    };

    const resetSearchState = () => {
        if (cancelTokenSourceRef.current) cancelTokenSourceRef.current.cancel();
        setUsers([]);
        setNextOffset(0);
        setHasMore(true);
        setHasSearched(false);
    };

    const clearSearch = () => {
        resetSearchState();
        setSearchText("");
        setIsLoading(false);
    };

    const handleSearchChange = (input: string) => {
        if (processingAction) return;

        resetSearchState();
        setSearchText(input);

        if (input.length === 0) {
            setIsLoading(false);
        }
    };

    const handleUserAction = async (userId: number, action: 'invalidate' | 'delete') => {
        if (processingAction) return;

        setProcessingAction({ userId, action });

        try {
            if (action === 'invalidate') {
                await userService.invalidateUserSessions(userId);
            } else if (action === 'delete') {
                await userService.deleteUser(userId);
            }

            // If successful, clear the search to refresh the list
            clearSearch();
        } catch (error) {
            // Error handling is managed by toast messages
        } finally {
            setProcessingAction(null);
        }
    };

    useEffect(() => {
        if (searchText.length > 0) {
            fetchUsers();
        }
    }, [searchText]);

    useEffect(() => {
        if (!isAdmin) {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(screens)');
            }
        }
    }, [isAdmin]);

    if (!isAdmin) return null;

    return (
        <View style={styles.container}>
            <View style={[styles.topBar, {
                paddingTop: insets.top,
                height: 60 + insets.top
            }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    testID="back-button"
                    disabled={!!processingAction}
                >
                    <FontAwesome name="chevron-left" size={20} color="white" testID="icon-chevron-left" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>MANAGE USERS</Text>
                </View>

                <View style={styles.rightHeaderPlaceholder} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <FontAwesome name="search" size={18} color="#a1a1a1" style={styles.searchIcon} />
                    <TextInput
                        testID="search-input"
                        style={styles.searchInput}
                        placeholder="Search users..."
                        value={searchText}
                        onChangeText={handleSearchChange}
                        placeholderTextColor="#a1a1a1"
                        selectionColor="#6b2367"
                        editable={!processingAction}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity
                            onPress={clearSearch}
                            style={styles.clearButton}
                            disabled={!!processingAction}
                            testID="clear-button"
                        >
                            <FontAwesome name="times" size={18} color="#a1a1a1" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.flatListContentContainer}>
                <FlatList
                    data={users}
                    testID="users-list"
                    ListEmptyComponent={
                        <View style={styles.flatListEmptyContainer}>
                            {isLoading ? (
                                <ActivityIndicator size="large" color="#fff" />
                            ) : (
                                <View style={styles.flatListTextContainer}>
                                    <Text style={styles.flatListTitle}>
                                        {hasSearched ? "No users found" : "Search for users"}
                                    </Text>
                                    <Text style={styles.flatListSubtitle}>
                                        {hasSearched
                                            ? "Try searching for a different username"
                                            : "Enter a username to search"}
                                    </Text>
                                </View>
                            )}
                        </View>
                    }
                    keyExtractor={(item) => item.user_id.toString()}
                    renderItem={({ item }) => {
                        const isInvalidating = processingAction?.userId === item.user_id && processingAction?.action === 'invalidate';
                        const isDeleting = processingAction?.userId === item.user_id && processingAction?.action === 'delete';

                        return (
                            <View style={styles.userItem}>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName} numberOfLines={1}>
                                        @{item.username}
                                    </Text>
                                    <Text style={styles.userId}>
                                        ID: {item.user_id}
                                    </Text>
                                </View>
                                <View style={styles.userActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleUserAction(item.user_id, 'invalidate')}
                                        disabled={!!processingAction}
                                        testID={`invalidate-button-${item.user_id}`}
                                    >
                                        {isInvalidating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <FontAwesome name="sign-out" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleUserAction(item.user_id, 'delete')}
                                        disabled={!!processingAction}
                                        testID={`delete-button-${item.user_id}`}
                                    >
                                        {isDeleting ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <FontAwesome name="trash" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                    indicatorStyle="white"
                    onEndReached={() => {
                        if (!isLoading && users.length > 0) {
                            fetchUsers();
                        }
                    }}
                    onEndReachedThreshold={0.2}
                    ListFooterComponent={
                        isLoading && users.length > 0 ? (
                            <ActivityIndicator size="large" color="#fff" style={{ padding: 24 }} />
                        ) : null
                    }
                    contentContainerStyle={{ flexGrow: 1 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#171717"
    },
    topBar: {
        backgroundColor: "#242424",
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        elevation: 10,
        position: 'relative',
        zIndex: 10,
    },
    backButton: {
        padding: 10,
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textTransform: 'uppercase',
    },
    rightHeaderPlaceholder: {
        width: 40,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#242424",
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#333333",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: 'white',
        fontSize: 16,
    },
    clearButton: {
        padding: 8,
    },
    flatListContentContainer: {
        flex: 1,
    },
    flatListEmptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    flatListTextContainer: {
        alignItems: 'center',
    },
    flatListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    flatListSubtitle: {
        fontSize: 14,
        color: '#a1a1a1',
        textAlign: 'center',
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    userId: {
        fontSize: 12,
        color: '#a1a1a1',
    },
    userActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
});

export default ManageUsersScreen;
