import { authService } from '@/api/authService';
import { UserDetails } from '@/types/auth/user_details';
import { parseBackendError } from '@/utils/errorUtils';
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

const validateUsername = (username: string) => {
    if (!username) return 'Username is required.';
    if (username.length < 3) return 'Username must be at least 3 characters long.';
    if (username.length > 20) return 'Username must be at most 20 characters long.';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain alphanumeric characters and underscores.';
    return '';
};

interface CompleteSpotifyModalProps {
    isVisible: boolean;
    onClose: () => void;
    setAuthData: (userDetails: Partial<UserDetails>, accessToken?: string) => Promise<void>;
}

export const CompleteSpotifyModal: React.FC<CompleteSpotifyModalProps> = ({ isVisible, onClose, setAuthData }) => {
    const [username, setUsername] = useState('');
    const [requestErrors, setRequestErrors] = useState<string[]>([]);
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
            setUsername('');
            setRequestErrors([]);
            setIsLoading(false);
            setUsernameTouched(false);

            onClose();
        });
    };

    const usernameError = usernameTouched ? validateUsername(username) : '';
    const isFormValid = usernameError === '' && username;

    const renderError = (error: string) => {
        return error ? <Text style={styles.errorText}>{`• ${error}`}</Text> : null;
    };

    const handleBackendError = (error: unknown) => {
        if (error instanceof AxiosError) {
            const errorDetails = error.response?.data?.detail;
            setRequestErrors(parseBackendError(errorDetails));
            return;
        }
        setRequestErrors(['An unexpected error occurred. Please try again.']);
    };

    const handleSaveUsername = async () => {
        setUsernameTouched(true);
        if (!isFormValid) return;

        setIsLoading(true);
        setRequestErrors([]);

        try {
            const response = await authService.completeSpotify(username);
            await setAuthData(response.data.user_details);
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
                        editable={!isLoading} />
                </View>

                {((usernameTouched || requestErrors.length > 0) && (usernameError || requestErrors.length > 0)) ? (
                    <View style={styles.errorBox}>
                        {renderError(usernameError)}
                        {requestErrors.map((err, index) => renderError(err))}
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.saveUsernameButton, { opacity: isFormValid ? 1 : 0.6 }]}
                    onPress={handleSaveUsername}
                    disabled={!isFormValid || isLoading}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
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
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: "#313131",
        borderRadius: 5,
        color: '#fff',
    },
    inputValid: {
        borderColor: '#6b2367',
        borderWidth: 2,
    },
    inputError: {
        borderColor: '#ff4444',
        borderWidth: 2,
    },
    saveUsernameButton: {
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
    errorBox: {
        width: '100%',
        backgroundColor: '#ff4444',
        padding: 10,
        borderRadius: 5,
    },
    errorText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});