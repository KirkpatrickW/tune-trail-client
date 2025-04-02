import { localityService } from '@/api/localityService';
import { trackService } from '@/api/trackService';
import { useAuth } from '@/context/AuthContext';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { SearchTracksModal } from '../../../src/components/tracks/SearchTracksModal';

// Mock the AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock the services
jest.mock('@/api/localityService', () => ({
    localityService: {
        addTrackToLocality: jest.fn(),
    },
}));

jest.mock('@/api/trackService', () => ({
    trackService: {
        searchTracks: jest.fn(),
    },
}));

// Mock react-native Animated
jest.mock('react-native', () => {
    const React = require('react');
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
                    value._value = config.toValue;
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
        TextInput: 'TextInput',
        ActivityIndicator: 'ActivityIndicator',
        FlatList: ({ data, renderItem, testID, keyExtractor }: any) => {
            if (!data || data.length === 0) return null;
            return React.createElement('View', { testID },
                data.map((item: any, index: number) =>
                    React.createElement('View', {
                        key: keyExtractor ? keyExtractor(item, index) : item.spotify_id,
                        testID: `track-item-${item.spotify_id}`,
                        children: renderItem({ item, index })
                    })
                )
            );
        },
        Dimensions: {
            get: () => ({ height: 800 }),
        },
    };
});

// Mock FastImage
jest.mock('react-native-fast-image', () => 'FastImage');

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    FontAwesome6: 'FontAwesome6',
}));

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
    NativeUnimoduleProxy: {
        callMethod: jest.fn(),
    },
}));

// Mock expo-font
jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
}));

describe('SearchTracksModal', () => {
    const mockOnClose = jest.fn();
    const mockOnTrackAdded = jest.fn();
    const mockLocalityDetails = {
        localityId: '123',
        name: 'Test Locality',
        existingSpotifyTrackIds: ['existing-track-1'],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: true,
        });
    });

    it('renders nothing when not visible', () => {
        const { queryByTestId } = render(
            <SearchTracksModal
                isVisible={false}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );
        expect(queryByTestId('search-tracks-modal')).toBeNull();
    });

    it('renders nothing when not authenticated', () => {
        (useAuth as jest.Mock).mockReturnValue({
            isAuthenticated: false,
        });

        const { queryByTestId } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );
        expect(queryByTestId('search-tracks-modal')).toBeNull();
    });

    it('renders search input and cancel button when visible', async () => {
        const { getByPlaceholderText, getByText } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(getByPlaceholderText('What do you want to add?')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
    });

    it('fetches tracks when search text changes', async () => {
        const mockTracks = [
            {
                spotify_id: 'track-1',
                name: 'Test Track 1',
                artists: ['Artist 1'],
                cover: { small: 'url1', medium: 'url2', large: 'url3' },
            },
        ];

        (trackService.searchTracks as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                total_matching_results: 50,
                results: mockTracks,
            },
        });

        const { getByPlaceholderText } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const searchInput = getByPlaceholderText('What do you want to add?');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        expect(trackService.searchTracks).toHaveBeenCalledWith('test', 0, expect.any(Object));
    });

    it('handles track addition', async () => {
        const mockTrack = {
            spotify_id: 'track-1',
            name: 'Test Track 1',
            artists: ['Artist 1'],
            cover: { small: 'url1', medium: 'url2', large: 'url3' },
        };

        (trackService.searchTracks as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                total_matching_results: 50,
                results: [mockTrack],
            },
        });

        (localityService.addTrackToLocality as jest.Mock).mockResolvedValueOnce({});

        const { getByTestId } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for tracks to load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const addButton = getByTestId('add-track-button-track-1');
        await act(async () => {
            fireEvent.press(addButton);
        });

        expect(localityService.addTrackToLocality).toHaveBeenCalledWith('123', 'track-1');
        expect(mockOnTrackAdded).toHaveBeenCalled();
    });

    it('shows loading state when adding track', async () => {
        const mockTrack = {
            spotify_id: 'track-1',
            name: 'Test Track 1',
            artists: ['Artist 1'],
            cover: { small: 'url1', medium: 'url2', large: 'url3' },
        };

        (trackService.searchTracks as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                total_matching_results: 50,
                results: [mockTrack],
            },
        });

        // Mock a slow response for addTrackToLocality
        (localityService.addTrackToLocality as jest.Mock).mockImplementation(() =>
            new Promise(resolve => setTimeout(resolve, 100))
        );

        const { getByTestId } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for tracks to load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const addButton = getByTestId('add-track-button-track-1');
        await act(async () => {
            fireEvent.press(addButton);
        });

        // Should show loading indicator
        expect(getByTestId('loading-indicator-track-1')).toBeTruthy();
    });

    it('handles search error gracefully', async () => {
        (trackService.searchTracks as jest.Mock).mockRejectedValueOnce(new Error('Search failed'));

        const { getByPlaceholderText } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const searchInput = getByPlaceholderText('What do you want to add?');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Should not throw error, just silently fail
        expect(trackService.searchTracks).toHaveBeenCalled();
    });

    it('handles track addition error gracefully', async () => {
        const mockTrack = {
            spotify_id: 'track-1',
            name: 'Test Track 1',
            artists: ['Artist 1'],
            cover: { small: 'url1', medium: 'url2', large: 'url3' },
        };

        (trackService.searchTracks as jest.Mock).mockResolvedValueOnce({
            data: {
                next_offset: 20,
                total_matching_results: 50,
                results: [mockTrack],
            },
        });

        (localityService.addTrackToLocality as jest.Mock).mockRejectedValueOnce(new Error('Add failed'));

        const { getByPlaceholderText, getByTestId } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const searchInput = getByPlaceholderText('What do you want to add?');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for tracks to load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const addButton = getByTestId('add-track-button-track-1');
        await act(async () => {
            fireEvent.press(addButton);
        });

        // Should not throw error, just silently fail
        expect(localityService.addTrackToLocality).toHaveBeenCalled();
    });

    it('clears search input and loading state when input is empty', async () => {
        const { getByTestId } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for tracks to load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Clear the input
        await act(async () => {
            fireEvent.changeText(searchInput, '');
        });

        // Wait for debounce
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        // Should not call searchTracks again when input is empty
        expect(trackService.searchTracks).toHaveBeenCalledTimes(1);
    });

    it('loads more tracks when reaching end of list', async () => {
        const mockTracks = [
            {
                spotify_id: 'track-1',
                name: 'Test Track 1',
                artists: ['Artist 1'],
                cover: { small: 'url1', medium: 'url2', large: 'url3' },
            },
            {
                spotify_id: 'track-2',
                name: 'Test Track 2',
                artists: ['Artist 2'],
                cover: { small: 'url1', medium: 'url2', large: 'url3' },
            },
        ];

        (trackService.searchTracks as jest.Mock)
            .mockResolvedValueOnce({
                data: {
                    next_offset: 20,
                    total_matching_results: 50,
                    results: [mockTracks[0]],
                },
            })
            .mockResolvedValueOnce({
                data: {
                    next_offset: 40,
                    total_matching_results: 50,
                    results: [mockTracks[1]],
                },
            });

        const { getByTestId } = render(
            <SearchTracksModal
                isVisible={true}
                onClose={mockOnClose}
                onTrackAdded={mockOnTrackAdded}
                localityDetails={mockLocalityDetails}
            />
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const searchInput = getByTestId('search-input');
        await act(async () => {
            fireEvent.changeText(searchInput, 'test');
        });

        // Wait for initial tracks to load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Simulate reaching end of list
        const tracksList = getByTestId('tracks-list');
        await act(async () => {
            fireEvent(tracksList, 'onEndReached');
        });

        // Should call searchTracks again with next offset
        expect(trackService.searchTracks).toHaveBeenCalledTimes(2);
        expect(trackService.searchTracks).toHaveBeenLastCalledWith('test', 20, expect.any(Object));
    });
}); 