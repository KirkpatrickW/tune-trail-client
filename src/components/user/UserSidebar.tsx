import { authService } from '@/api/authService';
import { useAuth } from '@/context/AuthContext';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for the icon
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UserSidebarProps {
    isVisible: boolean;
    onClose: () => void;
}

export const UserSidebar = ({ isVisible, onClose }: UserSidebarProps) => {
    const router = useRouter();

    const { isAuthenticated, clearAccessToken } = useAuth();

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
        try {
            await authService.logout()
        } catch (error) { }

        await clearAccessToken();
        router.replace("/auth");
    };

    const handleLinkSpotify = () => {
        console.log("Link Spotify!")
    };

    const handleUnlinkSpotify = () => {

    };


    if (!isVisible) return null;

    return (
        <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={closeModal}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
                <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
                    <Text style={styles.welcomeText}>Welcome,</Text>
                    <Text style={styles.usernameText}>Guest</Text>
                </View>

                <View style={styles.navigationContainer}>
                    <TouchableOpacity style={styles.navButton}>
                        <Text style={styles.navButtonText}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton}>
                        <Text style={styles.navButtonText}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton}>
                        <Text style={styles.navButtonText}>Help</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.bottomContainer, { marginBottom: insets.bottom }]}>
                    {isAuthenticated ? (
                        <>
                            <TouchableOpacity style={styles.unlinkSpotifyButton} onPress={handleUnlinkSpotify} activeOpacity={0.9}>
                                <FontAwesome name="spotify" size={20} color="#1DB954" style={styles.icon} />
                                <Text style={[styles.buttonText, { color: '#1DB954' }]}>UNLINK SPOTIFY</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.linkSpotifyButton} onPress={handleLinkSpotify} activeOpacity={0.9}>
                                <FontAwesome name="spotify" size={20} color="#fff" style={styles.icon} />
                                <Text style={styles.buttonText}>LINK SPOTIFY</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.logoutButton} onPress={handleLogOut} activeOpacity={0.9}>
                                <FontAwesome name="sign-out" size={20} color="#000" style={styles.icon} />
                                <Text style={[styles.buttonText, { color: '#000' }]}>LOG OUT</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={styles.signinButton} onPress={handleSignIn} activeOpacity={0.9}>
                            <FontAwesome name="sign-in" size={20} color="#fff" style={styles.icon} />
                            <Text style={styles.buttonText}>SIGN IN</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
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