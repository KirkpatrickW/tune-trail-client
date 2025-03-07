import { parseBackendError } from '@/utils/errorUtils';
import { FontAwesome6 } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CompleteSpotifyModalProps {
    isVisible: boolean;
    onClose: () => void;
}

const validateUsername = (username: string) => {
    if (!username) return 'Username is required.';
    if (username.length < 3) return 'Username must be at least 3 characters long.';
    if (username.length > 20) return 'Username must be at most 20 characters long.';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain alphanumeric characters and underscores.';
    return '';
};

export const CompleteSpotifyModal = ({ isVisible, onClose }: CompleteSpotifyModalProps) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usernameTouched, setUsernameTouched] = useState(false);

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
        ]).start(() => {
            onClose();
        });
    };

    const usernameError = usernameTouched ? validateUsername(username) : '';
    const isFormValid = usernameError === '' && username;

    const handleBackendError = (error: unknown) => {
        if (error instanceof AxiosError) {
            const errorDetails = error.response?.data?.detail;
            setError(parseBackendError(errorDetails).join('\n'));
            return;
        }
        setError('An unexpected error occurred. Please try again.');
    };

    const handleSave = async () => {
        setUsernameTouched(true);
        if (!isFormValid) return;

        setIsLoading(true);
        setError('');

        try {
            // await authService.updateUsername(username);
            closeModal();
        } catch (error) {
            handleBackendError(error);
        }
        setIsLoading(false);
    };

    if (!isVisible) return null;

    return (
        <View style={styles.modalContainer}>
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModal}
                >
                    <FontAwesome6 name="xmark" size={16} color="#a1a1a1" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Choose Your Username</Text>
                    <Text style={styles.subtitle}>This will be your unique profile identifier</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                        onFocus={() => setUsernameTouched(true)}
                        style={[
                            styles.input,
                            usernameTouched && (isFormValid ? styles.inputValid : styles.inputError)
                        ]}
                        placeholderTextColor="#a1a1a1"
                        selectionColor="#6b2367"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {(usernameError || error) && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{usernameError || error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.saveButton, { opacity: isFormValid ? 1 : 0.6 }]}
                    onPress={handleSave}
                    disabled={!isFormValid || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>SAVE USERNAME</Text>
                    )}
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
        width: '85%',
        backgroundColor: '#242424',
        borderRadius: 15,
        padding: 24,
        position: 'relative',
    },
    header: {
        marginBottom: 20,
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
    inputContainer: {
        marginVertical: 15,
    },
    input: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: "#313131",
        borderRadius: 8,
        color: '#fff',
        fontSize: 16,
    },
    inputValid: {
        borderColor: '#6b2367',
        borderWidth: 1,
    },
    inputError: {
        borderColor: '#ff4444',
        borderWidth: 1,
    },
    saveButton: {
        backgroundColor: '#6b2367',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorBox: {
        backgroundColor: '#ff444433',
        padding: 10,
        borderRadius: 8,
        marginVertical: 10,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
        zIndex: 1,
    },
});