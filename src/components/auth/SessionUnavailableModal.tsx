import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface LogoutModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const SessionUnavailableModal: React.FC<LogoutModalProps> = ({ isVisible, onClose }) => {
    const router = useRouter();

    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

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
                toValue: screenHeight,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    const handleSignIn = () => {
        closeModal();
        router.replace("/auth");
    };

    if (!isVisible) return null;

    return (
        <View style={styles.modalContainer} testID="session-unavailable-modal">
            <TouchableWithoutFeedback onPress={closeModal}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} testID="session-unavailable-backdrop" />
            </TouchableWithoutFeedback>

            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal} testID="session-unavailable-close">
                    <FontAwesome name="times" size={24} color="#a1a1a1" />
                </TouchableOpacity>

                <FontAwesome name="exclamation-circle" size={40} style={styles.modalIcon} />
                <Text style={styles.title}>Session Unavailable!</Text>
                <Text style={styles.subtitle}>Your session has expired or was cancelled. Please log in again.</Text>

                <TouchableOpacity
                    style={styles.signinButton}
                    onPress={handleSignIn}
                    activeOpacity={0.9}
                    testID="session-unavailable-signin">
                    <FontAwesome name="sign-in" size={20} color="#fff" style={styles.icon} />
                    <Text style={styles.buttonText}>SIGN IN</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#242424',
        borderRadius: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#a1a1a1',
        textAlign: 'center',
    },
    modalIcon: {
        color: 'white',
        marginBottom: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
    signinButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#6b2367',
        borderRadius: 30,
        marginTop: 10,
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

export default SessionUnavailableModal;