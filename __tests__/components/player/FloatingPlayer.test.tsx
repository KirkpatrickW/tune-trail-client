import { usePlayer } from '@/context/PlayerContext';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { FloatingPlayer } from '../../../src/components/player/FloatingPlayer';

// Mock the PlayerContext
jest.mock('@/context/PlayerContext', () => ({
    usePlayer: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    FontAwesome: 'FontAwesome',
}));

// Mock react-native-fast-image
jest.mock('react-native-fast-image', () => 'FastImage');

// Mock MovingText
jest.mock('@/components/misc/MovingText', () => ({
    MovingText: 'MovingText',
}));

// Mock Animated
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.Animated.timing = jest.fn().mockImplementation((value, config) => ({
        start: (callback?: () => void) => {
            value.setValue(config.toValue);
            callback && callback();
        },
    }));
    return RN;
});

describe('FloatingPlayer', () => {
    const mockToggleSession = jest.fn();
    const mockRouterPush = jest.fn();
    const mockRouterNavigate = jest.fn();

    const mockTrack = {
        name: 'Test Track',
        artists: ['Artist 1', 'Artist 2'],
        cover: {
            small: 'small.jpg',
            medium: 'medium.jpg',
            large: 'large.jpg',
        },
    };

    const mockLocality = {
        locality_id: '123',
        name: 'Test Locality',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (usePlayer as jest.Mock).mockReturnValue({
            currentLocality: mockLocality,
            currentTrack: mockTrack,
            isSessionActive: false,
            toggleSession: mockToggleSession,
        });
        (useRouter as jest.Mock).mockReturnValue({
            push: mockRouterPush,
            navigate: mockRouterNavigate,
        });
    });

    it('renders globe button when session is not active', () => {
        const { getByTestId } = render(<FloatingPlayer />);
        expect(getByTestId('globe-button')).toBeTruthy();
    });

    it('renders player when session is active', async () => {
        (usePlayer as jest.Mock).mockReturnValue({
            currentLocality: mockLocality,
            currentTrack: mockTrack,
            isSessionActive: true,
            toggleSession: mockToggleSession,
        });

        const { getByTestId } = render(<FloatingPlayer />);
        await act(async () => {
            expect(getByTestId('player-container')).toBeTruthy();
            expect(getByTestId('location-container')).toBeTruthy();
        });
    });

    it('shows loading state when toggling session', async () => {
        const { getByTestId } = render(<FloatingPlayer />);

        // Mock toggleSession to be async and resolve after a delay
        mockToggleSession.mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(resolve, 100);
            });
        });

        // Press the button and wait for the loading state
        await act(async () => {
            fireEvent.press(getByTestId('globe-button'));
        });

        // Wait for the loading indicator to appear
        await waitFor(() => {
            expect(getByTestId('loading-indicator')).toBeTruthy();
        });
    });

    it('hides loading state after toggleSession completes', async () => {
        const { getByTestId, queryByTestId } = render(<FloatingPlayer />);

        // Mock toggleSession to be async and resolve after a delay
        mockToggleSession.mockImplementation(() => {
            return new Promise(resolve => {
                setTimeout(resolve, 100);
            });
        });

        // Press the button and wait for the loading state
        await act(async () => {
            fireEvent.press(getByTestId('globe-button'));
        });

        // Wait for the loading indicator to appear
        await waitFor(() => {
            expect(getByTestId('loading-indicator')).toBeTruthy();
        });

        // Wait for toggleSession to complete and loading state to be cleared
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // The loading indicator should be gone
        expect(queryByTestId('loading-indicator')).toBeNull();
    });

    it('navigates to locality when location container is pressed', async () => {
        (usePlayer as jest.Mock).mockReturnValue({
            currentLocality: mockLocality,
            currentTrack: mockTrack,
            isSessionActive: true,
            toggleSession: mockToggleSession,
        });

        const { getByTestId } = render(<FloatingPlayer />);
        await act(async () => {
            fireEvent.press(getByTestId('location-container'));
        });
        expect(mockRouterPush).toHaveBeenCalledWith({
            pathname: '/localities/[id]',
            params: {
                id: mockLocality.locality_id,
                name: mockLocality.name,
            },
        });
    });

    it('navigates to player when player container is pressed', async () => {
        (usePlayer as jest.Mock).mockReturnValue({
            currentLocality: mockLocality,
            currentTrack: mockTrack,
            isSessionActive: true,
            toggleSession: mockToggleSession,
        });

        const { getByTestId } = render(<FloatingPlayer />);
        await act(async () => {
            fireEvent.press(getByTestId('player-container'));
        });
        expect(mockRouterNavigate).toHaveBeenCalledWith('/player');
    });

    it('displays track information correctly', async () => {
        (usePlayer as jest.Mock).mockReturnValue({
            currentLocality: mockLocality,
            currentTrack: mockTrack,
            isSessionActive: true,
            toggleSession: mockToggleSession,
        });

        const { getByTestId } = render(<FloatingPlayer />);
        await act(async () => {
            expect(getByTestId('track-name-container')).toBeTruthy();
            expect(getByTestId('artist-name-container')).toBeTruthy();
            expect(getByTestId('album-art')).toBeTruthy();
        });
    });

    it('displays locality information correctly', async () => {
        (usePlayer as jest.Mock).mockReturnValue({
            currentLocality: mockLocality,
            currentTrack: mockTrack,
            isSessionActive: true,
            toggleSession: mockToggleSession,
        });

        const { getByTestId } = render(<FloatingPlayer />);
        await act(async () => {
            expect(getByTestId('locality-label')).toBeTruthy();
            expect(getByTestId('locality-name-container')).toBeTruthy();
        });
    });

    it('calls toggleSession when stop button is pressed', async () => {
        (usePlayer as jest.Mock).mockReturnValue({
            currentLocality: mockLocality,
            currentTrack: mockTrack,
            isSessionActive: true,
            toggleSession: mockToggleSession,
        });

        const { getByTestId } = render(<FloatingPlayer />);
        await act(async () => {
            fireEvent.press(getByTestId('stop-button'));
        });
        expect(mockToggleSession).toHaveBeenCalled();
    });
}); 