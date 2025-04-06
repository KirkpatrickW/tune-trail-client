import { authService } from '@/api/authService';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpotifyAuthModal } from '../auth/SpotifyAuthModal';

interface UserSidebarProps {
    isVisible: boolean;
    onClose: () => void;
}

export const UserSidebar = ({ isVisible, onClose }: UserSidebarProps) => {
    const router = useRouter();
    const { userDetails, isAuthenticated, setAuthData, clearAuthData } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [spotifyModalVisible, setSpotifyModalVisible] = useState(false);

    const slideAnim = useRef(new Animated.Value(-300)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (isVisible) {
            openModal();
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
        if (isLoading) return;

        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -300,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const handleSignIn = () => {
        router.replace("/auth");
    };

    const handleLogOut = async () => {
        setIsLoading(true);
        setActiveButton('logout');

        try {
            await authService.logout();
        } catch (error) { }

        await clearAuthData();
        setIsLoading(false);
        setActiveButton(null);
        router.replace("/auth");
    };

    const handleSpotifyAuthCode = async (authCode: string) => {
        setIsLoading(true);
        setActiveButton('linkSpotify');
        try {
            const response = await authService.linkSpotify(authCode);
            await setAuthData(response.data.user_details, response.data.access_token);
        } catch (error) { }
        setIsLoading(false);
        setActiveButton(null);
    };

    const handleUnlinkSpotify = async () => {
        setIsLoading(true);
        setActiveButton('unlinkSpotify');

        try {
            const response = await authService.unlinkSpotify()
            await setAuthData(response.data.user_details, response.data.access_token);
        } catch (error) { }
        setIsLoading(false);
        setActiveButton(null);
    };

    if (!isVisible) return null;

    return (
        <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={closeModal} disabled={isLoading}>
                <Animated.View testID="sidebar-overlay" style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View testID="user-sidebar" style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                <View testID="sidebar-content" style={[styles.titleContainer, { paddingTop: insets.top }]}>
                    <Text style={styles.welcomeText}>Welcome,</Text>
                    <Text style={styles.usernameText}>
                        {isAuthenticated ? "@" + userDetails?.username : "Guest"}
                    </Text>
                </View>

                {/* TODO: This needs removed, here temporarily for admin stuffs */}
                <View style={styles.navigationContainer}>
                    <TouchableOpacity style={styles.navButton} disabled={isLoading}>
                        <Text style={styles.navButtonText}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} disabled={isLoading}>
                        <Text style={styles.navButtonText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} disabled={isLoading}>
                        <Text style={styles.navButtonText}>Help</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.bottomContainer, { marginBottom: insets.bottom }]}>
                    {isAuthenticated ? (
                        <>
                            {userDetails?.is_oauth_account === false &&
                                <>
                                    {userDetails?.spotify_subscription !== null ? (
                                        <TouchableOpacity
                                            testID="unlink-spotify-button"
                                            style={styles.unlinkSpotifyButton}
                                            onPress={handleUnlinkSpotify}
                                            disabled={isLoading}
                                            activeOpacity={0.9}>
                                            <FontAwesome name="spotify" size={20} color="#1DB954" style={styles.icon} />
                                            {activeButton === 'unlinkSpotify' && isLoading ? (
                                                <ActivityIndicator color="#1DB954" />
                                            ) : (
                                                <Text style={[styles.buttonText, { color: '#1DB954' }]}>UNLINK SPOTIFY</Text>
                                            )}
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            testID="link-spotify-button"
                                            style={styles.linkSpotifyButton}
                                            onPress={() => setSpotifyModalVisible(true)}
                                            disabled={isLoading}
                                            activeOpacity={0.9}>
                                            <FontAwesome name="spotify" size={20} color="#fff" style={styles.icon} />
                                            {activeButton === 'linkSpotify' && isLoading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.buttonText}>LINK SPOTIFY</Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </>
                            }

                            <TouchableOpacity
                                testID="logout-button"
                                style={styles.logoutButton}
                                onPress={handleLogOut}
                                disabled={isLoading}
                                activeOpacity={0.9}>
                                <FontAwesome name="sign-out" size={20} color="#000" style={styles.icon} />
                                {activeButton === 'logout' && isLoading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={[styles.buttonText, { color: '#000' }]}>LOG OUT</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            testID="sign-in-button"
                            style={styles.signinButton}
                            onPress={handleSignIn}
                            disabled={isLoading}
                            activeOpacity={0.9}>
                            <FontAwesome name="sign-in" size={20} color="#fff" style={styles.icon} />
                            <Text style={styles.buttonText}>SIGN IN</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>

            <SpotifyAuthModal
                isVisible={spotifyModalVisible}
                onClose={() => setSpotifyModalVisible(false)}
                onAuthCodeReceived={handleSpotifyAuthCode} />
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        flexDirection: 'row',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sidebar: {
        width: 300,
        backgroundColor: '#242424',
        height: '100%',
    },
    titleContainer: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    welcomeText: {
        color: 'white',
        fontSize: 14,
        opacity: 0.7,
    },
    usernameText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    navigationContainer: {
        paddingVertical: 20,
    },
    navButton: {
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    navButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '500',
    },
    bottomContainer: {
        borderTopWidth: 1,
        borderTopColor: '#444',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#444',
        marginBottom: 20,
    },
    signinButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#6b2367',
        borderRadius: 30,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    linkSpotifyButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#1DB954',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    unlinkSpotifyButton: {
        width: '100%',
        padding: 15,
        borderRadius: 30,
        borderColor: '#1DB954',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    logoutButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 30,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    icon: {
        position: 'absolute',
        left: 15,
    },
});