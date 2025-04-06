import { authService } from '@/api/authService';
import { useAuth } from '@/context/AuthContext';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import AuthScreen from '../../src/app/auth';

// Mock the required dependencies
jest.mock('@/api/authService');
jest.mock('@/context/AuthContext');
jest.mock('expo-router');
jest.mock('react-native-webview', () => ({
    WebView: 'WebView',
}));
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('react-native-toast-message', () => ({
    __esModule: true,
    default: {
        show: jest.fn(),
        hide: jest.fn(),
    },
}));
jest.mock('@expo/vector-icons', () => ({
    FontAwesome: 'FontAwesome',
    FontAwesome6: 'FontAwesome6',
}));

// Mock the SpotifyAuthModal component
jest.mock('@/components/auth/SpotifyAuthModal', () => {
    return {
        SpotifyAuthModal: ({ onAuthCodeReceived, isVisible, onClose }: {
            onAuthCodeReceived: (code: string) => void,
            isVisible: boolean,
            onClose: () => void
        }) => {
            if (isVisible) {
                // Use a Promise to properly handle the async behavior
                Promise.resolve().then(() => {
                    onAuthCodeReceived('test-auth-code');
                });
            }
            return null;
        },
    };
});

describe('AuthScreen', () => {
    const mockSetAuthData = jest.fn();
    const mockIsAuthenticated = false;
    const mockRouter = {
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            setAuthData: mockSetAuthData,
            isAuthenticated: mockIsAuthenticated,
        });
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    it('should show error for empty username', () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);
        const usernameInput = getByPlaceholderText('Username');

        fireEvent(usernameInput, 'focus');
        fireEvent(usernameInput, 'blur');

        expect(getByText('• Username is required.')).toBeTruthy();
    });

    it('should show error for username less than 3 characters', () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);
        const usernameInput = getByPlaceholderText('Username');

        fireEvent(usernameInput, 'focus');
        fireEvent.changeText(usernameInput, 'ab');
        fireEvent(usernameInput, 'blur');

        expect(getByText('• Username must be at least 3 characters long.')).toBeTruthy();
    });

    it('should show error for username with invalid characters', () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);
        const usernameInput = getByPlaceholderText('Username');

        fireEvent(usernameInput, 'focus');
        fireEvent.changeText(usernameInput, 'user@name');
        fireEvent(usernameInput, 'blur');

        expect(getByText('• Username can only contain alphanumeric characters and underscores.')).toBeTruthy();
    });

    it('should not show error for valid username', () => {
        const { getByPlaceholderText, queryByText } = render(<AuthScreen />);
        const usernameInput = getByPlaceholderText('Username');

        fireEvent(usernameInput, 'focus');
        fireEvent.changeText(usernameInput, 'validuser');
        fireEvent(usernameInput, 'blur');

        expect(queryByText('• Username is required.')).toBeNull();
        expect(queryByText('• Username must be at least 3 characters long.')).toBeNull();
        expect(queryByText('• Username can only contain alphanumeric characters and underscores.')).toBeNull();
    });

    it('should show error for empty password', () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);
        const passwordInput = getByPlaceholderText('Password');

        fireEvent(passwordInput, 'focus');
        fireEvent(passwordInput, 'blur');

        expect(getByText('• Password is required.')).toBeTruthy();
    });

    it('should show error for password without uppercase letter', () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);
        const passwordInput = getByPlaceholderText('Password');

        fireEvent(passwordInput, 'focus');
        fireEvent.changeText(passwordInput, 'password1!');
        fireEvent(passwordInput, 'blur');

        expect(getByText('• Password must contain at least one uppercase letter.')).toBeTruthy();
    });

    it('should show error for password without special character', () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);
        const passwordInput = getByPlaceholderText('Password');

        fireEvent(passwordInput, 'focus');
        fireEvent.changeText(passwordInput, 'Password1');
        fireEvent(passwordInput, 'blur');

        expect(getByText('• Password must contain at least one special character.')).toBeTruthy();
    });

    it('should not show error for valid password', () => {
        const { getByPlaceholderText, queryByText } = render(<AuthScreen />);
        const passwordInput = getByPlaceholderText('Password');

        fireEvent(passwordInput, 'focus');
        fireEvent.changeText(passwordInput, 'Password1!');
        fireEvent(passwordInput, 'blur');

        expect(queryByText('• Password is required.')).toBeNull();
        expect(queryByText('• Password must contain at least one uppercase letter.')).toBeNull();
        expect(queryByText('• Password must contain at least one special character.')).toBeNull();
    });

    it('should toggle password visibility', () => {
        const { getByPlaceholderText, getByTestId } = render(<AuthScreen />);
        const passwordInput = getByPlaceholderText('Password');
        const toggleButton = getByTestId('password-toggle');

        expect(passwordInput.props.secureTextEntry).toBe(true);

        fireEvent.press(toggleButton);
        expect(passwordInput.props.secureTextEntry).toBe(false);

        fireEvent.press(toggleButton);
        expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should navigate to screens when continuing as guest', () => {
        const { getByText } = render(<AuthScreen />);
        const guestButton = getByText('CONTINUE AS GUEST');

        fireEvent.press(guestButton);

        expect(mockRouter.replace).toHaveBeenCalledWith('/(screens)');
    });

    it('should handle authenticated state', () => {
        (useAuth as jest.Mock).mockReturnValue({
            setAuthData: mockSetAuthData,
            isAuthenticated: true,
        });
        mockRouter.canGoBack.mockReturnValue(true);

        render(<AuthScreen />);

        expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should handle authenticated state with no history', () => {
        (useAuth as jest.Mock).mockReturnValue({
            setAuthData: mockSetAuthData,
            isAuthenticated: true,
        });
        mockRouter.canGoBack.mockReturnValue(false);

        render(<AuthScreen />);

        expect(mockRouter.replace).toHaveBeenCalledWith('/(screens)');
    });

    it('should handle successful login', async () => {
        const mockLoginResponse = {
            data: {
                user_details: { id: 1, username: 'testuser' },
                access_token: 'mock-token',
            },
        };
        (authService.login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        const usernameInput = getByPlaceholderText('Username');
        const passwordInput = getByPlaceholderText('Password');
        const loginButton = getByText('LOG IN');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Password1!');

        await act(async () => {
            fireEvent.press(loginButton);
        });

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith('testuser', 'Password1!');
            expect(mockSetAuthData).toHaveBeenCalledWith(
                mockLoginResponse.data.user_details,
                mockLoginResponse.data.access_token
            );
            expect(mockRouter.replace).toHaveBeenCalledWith('/(screens)');
        });
    });

    it('should handle login error with Axios error', async () => {
        const mockError = {
            response: {
                data: {
                    detail: ['Invalid credentials'],
                },
            },
        };
        (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        const usernameInput = getByPlaceholderText('Username');
        const passwordInput = getByPlaceholderText('Password');
        const loginButton = getByText('LOG IN');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Password1!');

        await act(async () => {
            fireEvent.press(loginButton);
        });

        await waitFor(() => {
            expect(getByText('• An unexpected error occurred. Please try again.')).toBeTruthy();
        });
    });

    it('should handle login error with non-Axios error', async () => {
        (authService.login as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        const usernameInput = getByPlaceholderText('Username');
        const passwordInput = getByPlaceholderText('Password');
        const loginButton = getByText('LOG IN');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Password1!');

        await act(async () => {
            fireEvent.press(loginButton);
        });

        await waitFor(() => {
            expect(getByText('• An unexpected error occurred. Please try again.')).toBeTruthy();
        });
    });

    it('should handle Axios error without response property', async () => {
        // Create an Axios error without a response property
        const axiosError = {
            isAxiosError: true,
            message: 'Network Error',
            name: 'AxiosError',
            config: {},
            code: 'ERR_NETWORK',
        };

        // Mock the login function to throw this error
        (authService.login as jest.Mock).mockRejectedValueOnce(axiosError);

        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        const usernameInput = getByPlaceholderText('Username');
        const passwordInput = getByPlaceholderText('Password');
        const loginButton = getByText('LOG IN');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Password1!');

        await act(async () => {
            fireEvent.press(loginButton);
        });

        await waitFor(() => {
            expect(getByText('• An unexpected error occurred. Please try again.')).toBeTruthy();
        });
    });

    it('should handle successful registration', async () => {
        const mockRegisterResponse = {
            data: {
                user_details: { id: 1, username: 'testuser' },
                access_token: 'mock-token',
            },
        };
        (authService.register as jest.Mock).mockResolvedValueOnce(mockRegisterResponse);

        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        const usernameInput = getByPlaceholderText('Username');
        const passwordInput = getByPlaceholderText('Password');
        const registerButton = getByText('REGISTER');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Password1!');

        await act(async () => {
            fireEvent.press(registerButton);
        });

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalledWith('testuser', 'Password1!');
            expect(mockSetAuthData).toHaveBeenCalledWith(
                mockRegisterResponse.data.user_details,
                mockRegisterResponse.data.access_token
            );
            expect(mockRouter.replace).toHaveBeenCalledWith('/(screens)');
        });
    });

    it('should handle registration error', async () => {
        const mockError = {
            response: {
                data: {
                    detail: ['Username already exists'],
                },
            },
        };
        (authService.register as jest.Mock).mockRejectedValueOnce(mockError);

        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        const usernameInput = getByPlaceholderText('Username');
        const passwordInput = getByPlaceholderText('Password');
        const registerButton = getByText('REGISTER');

        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Password1!');

        await act(async () => {
            fireEvent.press(registerButton);
        });

        await waitFor(() => {
            expect(getByText('• An unexpected error occurred. Please try again.')).toBeTruthy();
        });
    });

    it('should handle successful Spotify authentication', async () => {
        const mockSpotifyResponse = {
            data: {
                user_details: { id: 1, username: 'testuser' },
                access_token: 'mock-token',
            },
        };
        (authService.connectSpotify as jest.Mock).mockResolvedValueOnce(mockSpotifyResponse);

        const { getByText } = render(<AuthScreen />);
        const spotifyButton = getByText('CONTINUE WITH SPOTIFY');

        await act(async () => {
            fireEvent.press(spotifyButton);
        });

        // Wait for the Promise to resolve
        await waitFor(() => {
            expect(authService.connectSpotify).toHaveBeenCalledWith('test-auth-code');
            expect(mockSetAuthData).toHaveBeenCalledWith(
                mockSpotifyResponse.data.user_details,
                mockSpotifyResponse.data.access_token
            );
            expect(mockRouter.replace).toHaveBeenCalledWith('/(screens)');
        });
    });

    it('should handle Spotify authentication error', async () => {
        const mockError = new Error('Spotify auth failed');
        (authService.connectSpotify as jest.Mock).mockRejectedValueOnce(mockError);

        const { getByText } = render(<AuthScreen />);
        const spotifyButton = getByText('CONTINUE WITH SPOTIFY');

        await act(async () => {
            fireEvent.press(spotifyButton);
        });

        // Wait for the Promise to resolve
        await waitFor(() => {
            expect(authService.connectSpotify).toHaveBeenCalledWith('test-auth-code');
        });
    });

    it('should close Spotify modal when onClose is called', async () => {
        // Mock the SpotifyAuthModal component to call onClose
        const mockSpotifyAuthModal = jest.requireMock('@/components/auth/SpotifyAuthModal');
        const originalSpotifyAuthModal = mockSpotifyAuthModal.SpotifyAuthModal;

        mockSpotifyAuthModal.SpotifyAuthModal = ({ onAuthCodeReceived, isVisible, onClose }: {
            onAuthCodeReceived: (code: string) => void,
            isVisible: boolean,
            onClose: () => void
        }) => {
            if (isVisible) {
                // Call onClose after a short delay
                Promise.resolve().then(() => {
                    onClose();
                });
            }
            return null;
        };

        const { getByText } = render(<AuthScreen />);
        const spotifyButton = getByText('CONTINUE WITH SPOTIFY');

        await act(async () => {
            fireEvent.press(spotifyButton);
        });

        // Wait for the Promise to resolve
        await waitFor(() => {
            // The modal should be closed, so we can't verify it directly
            // But we can verify that the Spotify auth code was not received
            expect(authService.connectSpotify).not.toHaveBeenCalled();
        });

        // Restore the original mock
        mockSpotifyAuthModal.SpotifyAuthModal = originalSpotifyAuthModal;
    });
}); 