import { authService } from '@/api/authService';
import { useAuth } from '@/context/AuthContext';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { UserSidebar } from '../../../src/components/user/UserSidebar';

// Mock the AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock the authService
jest.mock('@/api/authService', () => ({
    authService: {
        logout: jest.fn(),
        linkSpotify: jest.fn(),
        unlinkSpotify: jest.fn(),
    },
}));

// Mock expo-router
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: mockRouterReplace,
        push: mockRouterPush,
    }),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({
        top: 0,
        bottom: 0,
    }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    FontAwesome: () => 'mock-icon',
}));

// Mock SpotifyAuthModal
jest.mock('@/components/auth/SpotifyAuthModal', () => ({
    SpotifyAuthModal: ({ isVisible, onClose, onAuthCodeReceived }: { isVisible: boolean; onClose: () => void; onAuthCodeReceived: (code: string) => void }) => {
        if (isVisible) {
            // Simulate successful auth after a delay
            setTimeout(() => {
                onAuthCodeReceived('mock-auth-code');
                onClose();
            }, 0);
            return 'mock-spotify-modal';
        }
        return null;
    },
}));

// Mock react-native Animated
jest.mock('react-native', () => {
    const mockAnimatedValue = (value: number) => ({
        _value: value,
        setValue: jest.fn(),
        _animation: null,
        _offset: 0,
        _startingValue: value,
        _interpolation: null,
        interpolate: jest.fn().mockReturnThis(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
    });

    return {
        View: 'View',
        Animated: {
            View: 'Animated.View',
            Value: mockAnimatedValue,
            timing: jest.fn().mockImplementation((value, config) => ({
                start: (callback?: (result: { finished: boolean }) => void) => {
                    // Set the value to 0.5 for fade animations
                    value._value = config.toValue === 1 ? 0.5 : config.toValue;
                    if (callback) {
                        callback({ finished: true });
                    }
                },
            })),
            parallel: jest.fn().mockImplementation((animations) => ({
                start: (callback?: (result: { finished: boolean }) => void) => {
                    animations.forEach((animation: { start: (callback?: (result: { finished: boolean }) => void) => void }) => {
                        animation.start();
                    });
                    if (callback) {
                        callback({ finished: true });
                    }
                },
            })),
        },
        StyleSheet: {
            create: (styles: any) => styles,
            flatten: (style: any) => style,
            hairlineWidth: 1,
            absoluteFill: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            absoluteFillObject: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
        },
        TouchableOpacity: 'TouchableOpacity',
        TouchableWithoutFeedback: 'TouchableWithoutFeedback',
        Text: 'Text',
        ActivityIndicator: 'ActivityIndicator',
    };
});

describe('UserSidebar', () => {
    const mockOnClose = jest.fn();
    const mockSetAuthData = jest.fn();
    const mockClearAuthData = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: null,
            isAuthenticated: false,
            isAdmin: false,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });
    });

    it('shows sign in button when not authenticated', async () => {
        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('sign-in-button')).toBeTruthy();
    });

    it('shows logout button when authenticated', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: { username: 'testuser' },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('logout-button')).toBeTruthy();
    });

    it('handles sign in button press', async () => {
        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const signInButton = getByTestId('sign-in-button');
        await act(async () => {
            fireEvent.press(signInButton);
        });

        expect(mockRouterReplace).toHaveBeenCalledWith('/auth');
    });

    it('handles logout button press', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: { username: 'testuser' },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const logoutButton = getByTestId('logout-button');
        await act(async () => {
            fireEvent.press(logoutButton);
        });

        expect(authService.logout).toHaveBeenCalled();
        expect(mockClearAuthData).toHaveBeenCalled();
        expect(mockRouterReplace).toHaveBeenCalledWith('/auth');
    });

    it('shows Spotify link button when not linked', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: {
                username: 'testuser',
                is_oauth_account: false,
                spotify_subscription: null
            },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('link-spotify-button')).toBeTruthy();
    });

    it('shows Spotify unlink button when linked', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: {
                username: 'testuser',
                is_oauth_account: false,
                spotify_subscription: { id: '123' }
            },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('unlink-spotify-button')).toBeTruthy();
    });

    it('handles Spotify link button press', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: {
                username: 'testuser',
                is_oauth_account: false,
                spotify_subscription: null
            },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const linkButton = getByTestId('link-spotify-button');
        await act(async () => {
            fireEvent.press(linkButton);
        });

        // Wait for the modal to handle the auth
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(authService.linkSpotify).toHaveBeenCalledWith('mock-auth-code');
    });

    it('handles Spotify unlink button press', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: {
                username: 'testuser',
                is_oauth_account: false,
                spotify_subscription: { id: '123' }
            },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const unlinkButton = getByTestId('unlink-spotify-button');
        await act(async () => {
            fireEvent.press(unlinkButton);
        });

        expect(authService.unlinkSpotify).toHaveBeenCalled();
    });

    it('handles logout error gracefully', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: { username: 'testuser' },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        // Mock the logout function to throw an error
        (authService.logout as jest.Mock).mockRejectedValueOnce(new Error('Logout failed'));

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const logoutButton = getByTestId('logout-button');
        await act(async () => {
            fireEvent.press(logoutButton);
        });

        // Even if logout fails, we should still clear auth data and redirect
        expect(mockClearAuthData).toHaveBeenCalled();
        expect(mockRouterReplace).toHaveBeenCalledWith('/auth');
    });

    it('handles Spotify link error gracefully', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: {
                username: 'testuser',
                is_oauth_account: false,
                spotify_subscription: null
            },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        // Mock the linkSpotify function to throw an error
        (authService.linkSpotify as jest.Mock).mockRejectedValueOnce(new Error('Link failed'));

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const linkButton = getByTestId('link-spotify-button');
        await act(async () => {
            fireEvent.press(linkButton);
        });

        // Wait for the modal to handle the auth
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(authService.linkSpotify).toHaveBeenCalledWith('mock-auth-code');
    });

    it('handles Spotify unlink error gracefully', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: {
                username: 'testuser',
                is_oauth_account: false,
                spotify_subscription: { id: '123' }
            },
            isAuthenticated: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        // Mock the unlinkSpotify function to throw an error
        (authService.unlinkSpotify as jest.Mock).mockRejectedValueOnce(new Error('Unlink failed'));

        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const unlinkButton = getByTestId('unlink-spotify-button');
        await act(async () => {
            fireEvent.press(unlinkButton);
        });

        // The error should be caught and handled gracefully
        expect(authService.unlinkSpotify).toHaveBeenCalled();
    });

    it('animates modal open when visible', async () => {
        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );

        // Wait for initial render and animation start
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const sidebar = getByTestId('user-sidebar');
        const overlay = getByTestId('sidebar-overlay');

        // Check final state after animation
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // The sidebar should be visible and not transformed
        expect(sidebar).toBeTruthy();
        expect(overlay.props.style[1].opacity._value).toBe(0.5);
    });

    it('animates modal close when not visible', async () => {
        const { getByTestId, rerender } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );

        // Wait for initial render and animation start
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Wait for open animation to complete
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
        });

        // Rerender with isVisible=false
        rerender(<UserSidebar isVisible={false} onClose={mockOnClose} />);

        // Wait for close animation to complete
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
        });

        // The component should be unmounted at this point
        expect(() => getByTestId('user-sidebar')).toThrow();
    });

    it('closes modal when overlay is pressed', async () => {
        const { getByTestId } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );

        // Wait for initial render
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const overlay = getByTestId('sidebar-overlay');
        await act(async () => {
            fireEvent.press(overlay);
        });

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows admin buttons when user is an admin', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: { username: 'adminuser' },
            isAuthenticated: true,
            isAdmin: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByText } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Check that admin buttons are visible
        expect(getByText('Manage Users')).toBeTruthy();
        expect(getByText('Manage Tracks')).toBeTruthy();
    });

    it('does not show admin buttons when user is not an admin', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: { username: 'regularuser' },
            isAuthenticated: true,
            isAdmin: false,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { queryByText } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Check that admin buttons are not visible
        expect(queryByText('Manage Users')).toBeNull();
        expect(queryByText('Manage Tracks')).toBeNull();
    });

    it('handles Manage Users button press', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: { username: 'adminuser' },
            isAuthenticated: true,
            isAdmin: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByText } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const manageUsersButton = getByText('Manage Users');
        await act(async () => {
            fireEvent.press(manageUsersButton);
        });

        // Check that router.push was called with the correct pathname
        expect(mockRouterPush).toHaveBeenCalledWith({
            pathname: '/admin/manage-users'
        });

        // Check that the modal was closed
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles Manage Tracks button press', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            userDetails: { username: 'adminuser' },
            isAuthenticated: true,
            isAdmin: true,
            setAuthData: mockSetAuthData,
            clearAuthData: mockClearAuthData,
        });

        const { getByText } = render(
            <UserSidebar isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const manageTracksButton = getByText('Manage Tracks');
        await act(async () => {
            fireEvent.press(manageTracksButton);
        });

        // Check that router.push was called with the correct pathname
        expect(mockRouterPush).toHaveBeenCalledWith({
            pathname: '/admin/manage-tracks'
        });

        // Check that the modal was closed
        expect(mockOnClose).toHaveBeenCalled();
    });
}); 