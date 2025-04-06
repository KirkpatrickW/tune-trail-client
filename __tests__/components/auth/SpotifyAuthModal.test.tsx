import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';
import { SpotifyAuthModal } from '../../../src/components/auth/SpotifyAuthModal';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    FontAwesome: () => null,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
    show: jest.fn(),
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => {
    const React = require('react');
    return {
        WebView: jest.fn().mockImplementation(({ onShouldStartLoadWithRequest, testID, renderLoading }) => {
            // Simulate initial load
            if (onShouldStartLoadWithRequest) {
                onShouldStartLoadWithRequest({ url: 'https://accounts.spotify.com/authorize' });
            }
            // Return both the WebView and its loading state
            return React.createElement(React.Fragment, null, [
                React.createElement('View', { key: 'webview', testID }),
                renderLoading && React.createElement('View', { key: 'loading', testID: 'loading-container' })
            ]);
        }),
    };
});

// Mock react-native
jest.mock('react-native', () => {
    const React = require('react');
    return {
        View: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
        TouchableOpacity: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
        Animated: {
            View: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
            Value: jest.fn().mockImplementation((value) => ({
                _value: value,
                setValue: jest.fn(),
                _animation: null,
                _offset: 0,
                _startingValue: value,
                _interpolation: null,
            })),
            timing: jest.fn().mockImplementation((value, config) => ({
                start: (callback?: (result: { finished: boolean }) => void) => {
                    value._value = config.toValue;
                    if (callback) callback({ finished: true });
                },
            })),
        },
        Dimensions: {
            get: jest.fn().mockReturnValue({ height: 800 }),
        },
        StyleSheet: {
            create: (styles: any) => styles,
            flatten: (style: any) => style,
        },
    };
});

describe('SpotifyAuthModal', () => {
    const mockOnClose = jest.fn();
    const mockOnAuthCodeReceived = jest.fn();
    const mockScreenHeight = 800;
    const mockSlideAnim = { _value: mockScreenHeight };

    beforeEach(() => {
        jest.clearAllMocks();
        (Animated.Value as jest.Mock).mockReturnValue(mockSlideAnim);
    });

    it('does not render when not visible', () => {
        const { queryByTestId } = render(
            <SpotifyAuthModal isVisible={false} onClose={mockOnClose} onAuthCodeReceived={mockOnAuthCodeReceived} />
        );
        expect(queryByTestId('spotify-auth-modal')).toBeNull();
    });

    it('renders and animates when visible', async () => {
        const { getByTestId } = render(
            <SpotifyAuthModal isVisible={true} onClose={mockOnClose} onAuthCodeReceived={mockOnAuthCodeReceived} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(getByTestId('spotify-auth-modal')).toBeTruthy();
        expect(mockSlideAnim._value).toBe(0); // Modal should slide up to 0
    });

    it('handles successful authentication', async () => {
        const { getByTestId } = render(
            <SpotifyAuthModal isVisible={true} onClose={mockOnClose} onAuthCodeReceived={mockOnAuthCodeReceived} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const webView = getByTestId('spotify-webview');
        const successUrl = 'tune-trail://spotify-auth-callback?code=test_auth_code';

        await act(async () => {
            fireEvent(webView, 'onShouldStartLoadWithRequest', { url: successUrl });
        });

        expect(mockOnAuthCodeReceived).toHaveBeenCalledWith('test_auth_code');
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles authentication error', async () => {
        const { getByTestId } = render(
            <SpotifyAuthModal isVisible={true} onClose={mockOnClose} onAuthCodeReceived={mockOnAuthCodeReceived} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const webView = getByTestId('spotify-webview');
        const errorUrl = 'tune-trail://spotify-auth-callback?error=access_denied';

        await act(async () => {
            fireEvent(webView, 'onShouldStartLoadWithRequest', { url: errorUrl });
        });

        expect(mockOnClose).toHaveBeenCalled();
        expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
            type: 'error',
            text1: 'Spotify Authentication Failed',
            text2: 'Please grant permissions to continue',
        });
    });

    it('handles authentication failure', async () => {
        const { getByTestId } = render(
            <SpotifyAuthModal isVisible={true} onClose={mockOnClose} onAuthCodeReceived={mockOnAuthCodeReceived} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const webView = getByTestId('spotify-webview');
        const failureUrl = 'tune-trail://spotify-auth-callback';

        await act(async () => {
            fireEvent(webView, 'onShouldStartLoadWithRequest', { url: failureUrl });
        });

        expect(mockOnClose).toHaveBeenCalled();
        expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
            type: 'error',
            text1: 'Authentication Error',
            text2: 'Failed to complete Spotify authentication',
        });
    });

    it('handles URL parsing error in handleDeepLink', async () => {
        const { getByTestId } = render(
            <SpotifyAuthModal isVisible={true} onClose={mockOnClose} onAuthCodeReceived={mockOnAuthCodeReceived} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const webView = getByTestId('spotify-webview');
        // Use a malformed URL that will cause URL parsing to fail
        const invalidUrl = 'tune-trail://spotify-auth-callback?code=test%'; // Invalid URL encoding

        // Mock URL constructor to throw an error
        const originalURL = global.URL;
        global.URL = class {
            constructor(url: string) {
                if (url.includes('test%')) {
                    throw new Error('Invalid URL');
                }
                return new originalURL(url);
            }
        } as any;

        await act(async () => {
            fireEvent(webView, 'onShouldStartLoadWithRequest', { url: invalidUrl });
        });

        // Restore original URL
        global.URL = originalURL;

        expect(mockOnClose).toHaveBeenCalled();
        expect(require('react-native-toast-message').show).toHaveBeenCalledWith({
            type: 'error',
            text1: 'Authentication Error',
            text2: 'Failed to complete Spotify authentication',
        });
    });

    it('closes modal when back button is pressed', async () => {
        const { getByTestId } = render(
            <SpotifyAuthModal isVisible={true} onClose={mockOnClose} onAuthCodeReceived={mockOnAuthCodeReceived} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const backButton = getByTestId('back-button');
        await act(async () => {
            fireEvent.press(backButton);
        });

        expect(mockOnClose).toHaveBeenCalled();
    });
}); 