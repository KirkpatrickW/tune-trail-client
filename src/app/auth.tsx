import { authService } from '@/api/authService';
import { SpotifyAuthModal } from '@/components/auth/SpotifyAuthModal';
import { useAuth } from '@/context/AuthContext';
import { parseBackendError } from '@/utils/errorUtils';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import { AxiosError } from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const validateUsername = (username: string) => {
    if (!username) return 'Username is required.';
    if (username.length < 3) return 'Username must be at least 3 characters long.';
    if (username.length > 20) return 'Username must be at most 20 characters long.';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain alphanumeric characters and underscores.';
    return '';
};

const validatePassword = (password: string) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (password.length > 32) return 'Password must be at most 32 characters long.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(password)) return 'Password must contain at least one digit.';
    if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?`~]/.test(password)) return 'Password must contain at least one special character.';
    return '';
};

export default function AuthScreen() {
    const { setAccessToken, isAuthenticated } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [usernameTouched, setUsernameTouched] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [requestErrors, setRequestErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [spotifyModalVisible, setSpotifyModalVisible] = useState(false);

    const usernameError = usernameTouched ? validateUsername(username) : '';
    const passwordError = passwordTouched ? validatePassword(password) : '';
    const isUsernameValid = usernameError === '';
    const isPasswordValid = passwordError === '';
    const isFormValid = isUsernameValid && isPasswordValid && username && password;

    const renderError = (error: string) => {
        return error ? <Text style={styles.errorText}>{`• ${error}`}</Text> : null;
    };

    const handleSpotify = () => {
        setSpotifyModalVisible(true);
    };

    const handleBackendError = (error: unknown) => {
        if (error instanceof AxiosError) {
            const errorDetails = error.response?.data?.detail;
            setRequestErrors(parseBackendError(errorDetails));
            return;
        }
        setRequestErrors(['An unexpected error occurred. Please try again.']);
    };

    const handleLogin = async () => {
        setRequestErrors([]);
        setIsLoading(true);

        try {
            const response = await authService.login(username, password);
            await setAccessToken(response.data.access_token);
            router.replace('/(screens)');
        } catch (error) {
            handleBackendError(error);
        }
        setIsLoading(false);
    };

    const handleRegister = async () => {
        setRequestErrors([]);
        setIsLoading(true);

        try {
            const response = await authService.register(username, password);
            await setAccessToken(response.data.access_token);
            router.replace('/(screens)');
        } catch (error) {
            handleBackendError(error);
        }
        setIsLoading(false);
    };

    const handleContinueAsGuest = () => {
        router.replace('/(screens)');
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((prevState) => !prevState);
    };

    const handleSpotifyAuthCode = async (code: string) => {
        setIsLoading(true);
        try {
            // Assumes you have a corresponding endpoint in authService for Spotify auth
            // const response = await authService.spotifyAuth(code);
            // await setAccessToken(response.data.access_token);
            // router.replace('/(screens)');

            console.log(code)
        } catch (error) {
            handleBackendError(error);
        }
        setIsLoading(false);
    };

    // Prevent authenticated users from accessing this screen.
    if (isAuthenticated) {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(screens)');
        }
        return null;
    }

    return (
        <View style={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="large" color="white" />
            ) : (
                <>
                    <TouchableOpacity style={styles.spotifyButton} onPress={handleSpotify} activeOpacity={0.9}>
                        <FontAwesome name="spotify" size={25} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>CONTINUE WITH SPOTIFY</Text>
                    </TouchableOpacity>

                    <View style={styles.orContainer}>
                        <View style={styles.orLine} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.orLine} />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            placeholder="Username"
                            value={username}
                            onChangeText={setUsername}
                            onFocus={() => setUsernameTouched(true)}
                            style={[styles.input, usernameTouched && (isUsernameValid ? styles.inputValid : styles.inputError)]}
                            placeholderTextColor="#a1a1a1"
                            selectionColor="#6b2367"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => setPasswordTouched(true)}
                            secureTextEntry={!isPasswordVisible}
                            style={[styles.input, passwordTouched && (isPasswordValid ? styles.inputValid : styles.inputError)]}
                            placeholderTextColor="#a1a1a1"
                            selectionColor="#6b2367"
                        />
                        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.passwordToggleIcon}>
                            <FontAwesome6 name={isPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#a1a1a1" />
                        </TouchableOpacity>
                    </View>

                    {(usernameTouched || passwordTouched || requestErrors.length > 0) && (usernameError || passwordError || requestErrors.length > 0) ? (
                        <View style={styles.errorBox}>
                            {renderError(usernameError)}
                            {renderError(passwordError)}
                            {requestErrors.map((err, index) => renderError(err))}
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.loginButton, { opacity: isFormValid ? 1 : 0.6 }]}
                        onPress={handleLogin}
                        disabled={!isFormValid}
                    >
                        <FontAwesome name="user" size={25} color="#000" style={styles.buttonIcon} />
                        <Text style={styles.loginButtonText}>LOG IN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registerButton, { opacity: isFormValid ? 1 : 0.6 }]}
                        onPress={handleRegister}
                        disabled={!isFormValid}
                    >
                        <FontAwesome name="user-plus" size={25} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>REGISTER</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.guestButton} onPress={handleContinueAsGuest} activeOpacity={0.9}>
                        <FontAwesome name="user-secret" size={25} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>CONTINUE AS GUEST</Text>
                    </TouchableOpacity>

                    <View style={styles.noteContainer}>
                        <FontAwesome name="info-circle" size={20} color="#fff" style={styles.noteIcon} />
                        <Text style={styles.noteText}>
                            For the full experience, it's recommended to continue with Spotify with a Premium account; otherwise, the app will be in preview mode. You can link your Spotify account later to unlock full functionality.
                        </Text>
                    </View>
                </>
            )}

            <SpotifyAuthModal
                isVisible={spotifyModalVisible}
                onClose={() => setSpotifyModalVisible(false)}
                onAuthCodeReceived={handleSpotifyAuthCode}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#171717',
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
    passwordToggleIcon: {
        position: 'absolute',
        right: 15,
    },
    loginButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 30,
        marginBottom: 10,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    loginButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    registerButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#6b2367',
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
    buttonIcon: {
        position: 'absolute',
        left: 15,
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'white',
    },
    orText: {
        fontSize: 16,
        color: 'white',
        marginHorizontal: 10,
    },
    spotifyButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#1DB954',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    guestButton: {
        width: '100%',
        padding: 15,
        borderRadius: 30,
        borderColor: 'white',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    noteContainer: {
        position: 'absolute',
        flex: 1,
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#242424"
    },
    noteIcon: {
        marginRight: 10,
    },
    noteText: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
        textAlign: 'justify',
        marginHorizontal: 10,
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