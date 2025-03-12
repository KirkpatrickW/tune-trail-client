import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

const SPOTIFY_CLIENT_ID = 'cbdfa4fd597743bf814729bfd1595f82';
const SPOTIFY_REDIRECT_URI = 'tune-trail://spotify-auth-callback';
const SPOTIFY_SCOPES = 'user-read-email user-read-private';
const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&show_dialog=true`;

interface SpotifyAuthModalProps {
    isVisible: boolean;
    onClose: () => void;
    onAuthCodeReceived: (authCode: string) => void;
}

export const SpotifyAuthModal: React.FC<SpotifyAuthModalProps> = ({ isVisible, onClose, onAuthCodeReceived }) => {
    const insets = useSafeAreaInsets();
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;

    useEffect(() => {
        if (isVisible) {
            openModal();
        }
    }, [isVisible]);

    const openModal = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeModal = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const normalizeUrl = (url: string): string => {
        return url.replace(/\/\//g, '/').replace(/^tune-trail:\//, 'tune-trail://');
    };

    const handleDeepLink = (url: string) => {
        const normalized = normalizeUrl(url);
        if (normalized.startsWith(SPOTIFY_REDIRECT_URI)) {
            try {
                const authUrl = new URL(normalized);
                const authCode = authUrl.searchParams.get('code');
                const error = authUrl.searchParams.get('error');

                if (error) {
                    handleAuthError(error);
                    return;
                }

                if (authCode) {
                    handleAuthSuccess(authCode);
                } else {
                    handleAuthFailure();
                }
            } catch (err) {
                console.error('Error parsing auth URL:', err);
                handleAuthFailure();
            }
        }
    };

    const handleAuthSuccess = (authCode: string) => {
        closeModal();
        onAuthCodeReceived(authCode);
    };

    const handleAuthError = (error: string) => {
        Toast.show({
            type: 'error',
            text1: 'Spotify Authentication Failed',
            text2: error === 'access_denied'
                ? 'Please grant permissions to continue'
                : `Spotify error: ${error}`,
        });
        closeModal();
    };

    const handleAuthFailure = () => {
        Toast.show({
            type: 'error',
            text1: 'Authentication Error',
            text2: 'Failed to complete Spotify authentication',
        });
        closeModal();
    };

    const onShouldStartLoadWithRequest = (request: any) => {
        if (request.url.startsWith(SPOTIFY_REDIRECT_URI)) {
            handleDeepLink(request.url);
            return false;
        }
        return true;
    };

    if (!isVisible) return null;

    return (
        <View style={styles.modalContainer}>
            <Animated.View style={[
                styles.modalContent,
                {
                    transform: [{ translateY: slideAnim }],
                    height: screenHeight,
                }
            ]}>
                <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity onPress={closeModal} style={styles.backButton}>
                        <FontAwesome name="chevron-left" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <WebView
                    source={{ uri: SPOTIFY_AUTH_URL }}
                    onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                    startInLoadingState={true}
                    renderLoading={() => <View style={styles.loadingContainer} />}
                    style={[styles.webView, { marginTop: 0 }]}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    sharedCookiesEnabled={true}
                    thirdPartyCookiesEnabled={true}
                    originWhitelist={['*']}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#171717',
        flex: 1,
    },
    topBar: {
        backgroundColor: '#242424',
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        zIndex: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    webView: {
        flex: 1,
        backgroundColor: '#171717',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#171717',
    },
});
