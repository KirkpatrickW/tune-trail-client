import { localityService } from '@/api/localityService';
import { useLocation } from '@/context/LocationContext';
import { PlayerProvider, usePlayer } from '@/context/PlayerContext';
import { act, renderHook } from '@testing-library/react-native';
import { usePathname } from 'expo-router';
import React from 'react';
import Toast from 'react-native-toast-message';
import TrackPlayer, { Event } from 'react-native-track-player';

type PlaybackActiveTrackChangedEvent = {
    type: typeof Event.PlaybackActiveTrackChanged;
    track?: {
        id?: string;
    };
};

type PlaybackQueueEndedEvent = {
    type: typeof Event.PlaybackQueueEnded;
};

type TrackPlayerEvent = PlaybackActiveTrackChangedEvent | PlaybackQueueEndedEvent;

// Mock dependencies
jest.mock('@/context/LocationContext', () => ({
    useLocation: jest.fn(),
}));

jest.mock('@/api/localityService', () => ({
    localityService: {
        getTracksForLocalities: jest.fn(),
    },
}));

jest.mock('expo-router', () => ({
    usePathname: jest.fn(),
}));

jest.mock('react-native-track-player', () => {
    return {
        __esModule: true,
        default: {
            reset: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
            getQueue: jest.fn(),
            setRepeatMode: jest.fn(),
            seekTo: jest.fn(),
            setVolume: jest.fn(),
            skip: jest.fn(),
            getCurrentTrack: jest.fn(),
            play: jest.fn(),
            pause: jest.fn(),
            setupPlayer: jest.fn(),
            updateOptions: jest.fn(),
        },
        useIsPlaying: () => ({ playing: false }),
        useProgress: () => ({ position: 0, duration: 0 }),
        useTrackPlayerEvents: jest.fn(),
        Event: {
            PlaybackTrackChanged: 'playback-track-changed',
            PlaybackQueueEnded: 'playback-queue-ended',
        },
        RepeatMode: {
            Queue: 'queue',
        },
        AppKilledPlaybackBehavior: {
            StopPlaybackAndRemoveNotification: 'stop-playback-and-remove-notification',
        },
    };
});

jest.mock('react-native-toast-message', () => ({
    __esModule: true,
    default: {
        show: jest.fn(),
    },
}));

describe('PlayerContext', () => {
    const mockUserLocation = {
        coords: {
            latitude: 40.7128,
            longitude: -74.0060,
        },
    };

    const mockLocalities = [
        {
            locality_id: '1',
            name: 'Locality 1',
            tracks: [
                {
                    track_id: '1',
                    name: 'Track 1',
                    artists: ['Artist 1'],
                    preview_url: 'https://example.com/track1.mp3',
                    cover: {
                        small: 'https://example.com/cover1-sm.jpg',
                        medium: 'https://example.com/cover1-md.jpg',
                        large: 'https://example.com/cover1-lg.jpg',
                    },
                },
                {
                    track_id: '2',
                    name: 'Track 2',
                    artists: ['Artist 2'],
                    preview_url: 'https://example.com/track2.mp3',
                    cover: {
                        small: 'https://example.com/cover2-sm.jpg',
                        medium: 'https://example.com/cover2-md.jpg',
                        large: 'https://example.com/cover2-lg.jpg',
                    },
                },
            ],
        },
        {
            locality_id: '2',
            name: 'Locality 2',
            tracks: [
                {
                    track_id: '3',
                    name: 'Track 3',
                    artists: ['Artist 3'],
                    preview_url: 'https://example.com/track3.mp3',
                    cover: {
                        small: 'https://example.com/cover3-sm.jpg',
                        medium: 'https://example.com/cover3-md.jpg',
                        large: 'https://example.com/cover3-lg.jpg',
                    },
                },
            ],
        },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerProvider>{children}</PlayerProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (useLocation as jest.Mock).mockReturnValue({ userLocation: mockUserLocation });
        (usePathname as jest.Mock).mockReturnValue('/');
        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValue({ data: mockLocalities });
        (TrackPlayer.getQueue as jest.Mock).mockReset();
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllTimers();
    });

    it('should provide initial values', () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        expect(result.current.currentLocality).toBeNull();
        expect(result.current.currentTrack).toBeNull();
        expect(result.current.isPlaying).toBe(false);
        expect(result.current.isSessionActive).toBe(false);
        expect(result.current.playbackPosition).toBe(0);
        expect(result.current.trackDuration).toBe(0);
        expect(result.current.volume).toBe(1.0);
        expect(result.current.radius).toBe(5000);
        expect(result.current.canSkipTrack).toBe(false);
        expect(result.current.canSkipLocality).toBe(false);
    });

    it('should toggle session', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        expect(result.current.isSessionActive).toBe(true);
        expect(localityService.getTracksForLocalities).toHaveBeenCalledWith(
            mockUserLocation.coords.latitude,
            mockUserLocation.coords.longitude,
            5000
        );
        expect(TrackPlayer.reset).toHaveBeenCalled();
        expect(TrackPlayer.add).toHaveBeenCalled();
        expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith('queue');

        await act(async () => {
            await result.current.toggleSession();
        });

        expect(result.current.isSessionActive).toBe(false);
        expect(TrackPlayer.reset).toHaveBeenCalled();
    });

    it('should start playback from beginning if no current track exists and localities are returned', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.toggleSession(); // end session
        });

        // Confirm session state cleared
        expect(result.current.isSessionActive).toBe(false);

        // Reset mocks
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([]);
        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValueOnce({
            data: mockLocalities,
        });

        await act(async () => {
            await result.current.toggleSession();
        });

        expect(result.current.currentTrack?.track_id).toBe('1');
        expect(result.current.currentLocality?.locality_id).toBe('1');
        expect(TrackPlayer.add).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should restore playback position when current track is found in new localities', async () => {
        // Set up initial queue state
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([
            { id: '1:1' },
            { id: '1:2' },
        ]);

        const { result } = renderHook(() => usePlayer(), { wrapper });

        // Start initial session
        await act(async () => {
            await result.current.toggleSession();
        });

        // Skip to second track
        await act(async () => {
            await result.current.skipToNextTrack();
        });

        // Mock getTracksForLocalities to return same track in different locality
        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValueOnce({
            data: [
                {
                    locality_id: '99',
                    name: 'New Locality',
                    tracks: [
                        {
                            track_id: '2', // Same track_id as current track
                            name: 'Track 2',
                            artists: ['Artist 2'],
                            preview_url: 'https://example.com/track2.mp3',
                            cover: {
                                small: 'https://example.com/cover2-sm.jpg',
                                medium: 'https://example.com/cover2-md.jpg',
                                large: 'https://example.com/cover2-lg.jpg',
                            },
                        }
                    ]
                }
            ]
        });

        // Update queue state for the new locality
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([
            { id: '99:2' },
        ]);

        // Simulate location change to trigger track refresh
        act(() => {
            result.current.setRadius(8000);
        });

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        // Verify track position was restored
        expect(result.current.currentTrack?.track_id).toBe('2');
        expect(result.current.currentLocality?.locality_id).toBe('99');
    });

    it('should insert ghost locality if current track is not in new localities', async () => {
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([
            { id: '1:1' },
        ]);

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession(); // sets current track to 1:1
        });

        const previousTrackId = result.current.currentTrack?.track_id;

        (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([
            { id: '1:1' },
        ]);

        // New localities do not include the current track
        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValueOnce({
            data: [
                {
                    locality_id: '99',
                    name: 'Freshland',
                    tracks: [],
                },
            ],
        });

        act(() => {
            result.current.setRadius(8000);
        });

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current.currentTrack?.track_id).toBe(previousTrackId);
        expect(result.current.currentLocality?.locality_id).toContain('ghost-');
    });

    it('should use ghost locality if no localities are returned', async () => {
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([
            { id: '1:1' },
        ]);

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession(); // sets current track to 1:1
        });

        const previousTrackId = result.current.currentTrack?.track_id;

        (TrackPlayer.getQueue as jest.Mock).mockResolvedValueOnce([
            { id: '1:1' },
        ]);

        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValueOnce({
            data: [],
        });

        act(() => {
            result.current.setRadius(7777);
        });

        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current.currentTrack?.track_id).toBe(previousTrackId);
        expect(result.current.currentLocality?.locality_id).toContain('ghost-');
    });

    it('should handle loadTracks failure and end session', async () => {
        (localityService.getTracksForLocalities as jest.Mock).mockRejectedValueOnce(
            new Error('Network error')
        );

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        expect(result.current.isSessionActive).toBe(false);
        expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            text1: 'Failed to start listening session',
        }));

        expect(result.current.currentTrack).toBeNull();
        expect(result.current.currentLocality).toBeNull();
    });

    it('should handle pause and resume', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        act(() => {
            result.current.pause();
        });

        expect(TrackPlayer.pause).toHaveBeenCalled();

        act(() => {
            result.current.resume();
        });

        expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should handle pause and resume, and end session after pause timeout', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        act(() => {
            result.current.pause();
        });

        // Fast-forward 5 minutes to trigger auto-end
        await act(async () => {
            jest.advanceTimersByTime(5 * 60 * 1000);
        });

        expect(Toast.show).toHaveBeenCalledWith({
            type: 'info',
            text1: 'Auto-ending listening session',
            text2: 'Pause timeout reached.',
        });

        expect(TrackPlayer.reset).toHaveBeenCalled();
        expect(result.current.isSessionActive).toBe(false);

        // Restart session and test resume cancels timeout
        await act(async () => {
            await result.current.toggleSession();
        });

        act(() => {
            result.current.pause(); // again
        });

        act(() => {
            result.current.resume(); // cancel timeout
        });

        // Clear mock to isolate new calls
        (Toast.show as jest.Mock).mockClear();

        // Fast-forward again — timeout shouldn't fire
        await act(async () => {
            jest.advanceTimersByTime(5 * 60 * 1000);
        });

        expect(Toast.show).not.toHaveBeenCalled(); // No new toast
    });

    it('should handle volume changes', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.setVolume(0.5);
        });

        expect(result.current.volume).toBe(0.5);
        expect(TrackPlayer.setVolume).toHaveBeenCalledWith(0.5);
    });

    it('should handle seeking', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.seekToPosition(30);
        });

        expect(TrackPlayer.seekTo).toHaveBeenCalledWith(30);
    });

    it('should skip to the next track in the same locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // 1:2
        });

        expect(TrackPlayer.skip).toHaveBeenCalledWith(1);
        expect(result.current.currentTrack?.track_id).toBe('2');
    });

    it('should skip to the first track of the next locality when at end of current locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // 1:2
        });

        expect(result.current.currentTrack?.track_id).toBe('2');

        await act(async () => {
            await result.current.skipToNextTrack(); // 2:3
        });

        expect(TrackPlayer.skip).toHaveBeenCalledWith(2);
        expect(result.current.currentLocality?.locality_id).toBe('2');
        expect(result.current.currentTrack?.track_id).toBe('3');
    });

    it('should loop to beginning when at end of last locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // 1:2
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // 2:3
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // wrap to 1:1
        });

        expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
        expect(result.current.currentLocality?.locality_id).toBe('1');
        expect(result.current.currentTrack?.track_id).toBe('1');
    });

    it('should show toast and end session on skipToNextTrack failure', async () => {
        (TrackPlayer.skip as jest.Mock).mockRejectedValueOnce(new Error('skip error'));

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextTrack();
        });

        expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            text1: 'Playback error',
        }));

        expect(result.current.isSessionActive).toBe(false);
    });

    it('should skip to the previous track in the same locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // to 1:2
        });

        expect(result.current.currentTrack?.track_id).toBe('2');

        await act(async () => {
            await result.current.skipToPreviousTrack(); // back to 1:1
        });

        expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
        expect(result.current.currentTrack?.track_id).toBe('1');
    });

    it('should skip to last track of previous locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // 1:2
        });

        await act(async () => {
            await result.current.skipToNextTrack(); // 2:3
        });

        await act(async () => {
            await result.current.skipToPreviousTrack(); // back to 1:2
        });

        expect(result.current.currentLocality?.locality_id).toBe('1');
        expect(result.current.currentTrack?.track_id).toBe('2');
    });

    it('should loop to last track of last locality when at beginning', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToPreviousTrack(); // wrap
        });

        expect(result.current.currentLocality?.locality_id).toBe('2');
        expect(result.current.currentTrack?.track_id).toBe('3');
    });

    it('should show toast and end session on skipToPreviousTrack failure', async () => {
        (TrackPlayer.skip as jest.Mock).mockRejectedValueOnce(new Error('skip error'));

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToPreviousTrack();
        });

        expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            text1: 'Playback error',
        }));

        expect(result.current.isSessionActive).toBe(false);
    });

    it('should skip to the first track of the next locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextLocality(); // to 2:3
        });

        expect(result.current.currentLocality?.locality_id).toBe('2');
        expect(result.current.currentTrack?.track_id).toBe('3');
    });

    it('should wrap to first locality when at last locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextLocality(); // to 2
        });

        await act(async () => {
            await result.current.skipToNextLocality(); // wrap to 1
        });

        expect(result.current.currentLocality?.locality_id).toBe('1');
        expect(result.current.currentTrack?.track_id).toBe('1');
    });

    it('should show toast and end session on skipToNextLocality failure', async () => {
        (TrackPlayer.skip as jest.Mock).mockRejectedValueOnce(new Error('skip error'));

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextLocality();
        });

        expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            text1: 'Playback error',
        }));

        expect(result.current.isSessionActive).toBe(false);
    });

    it('should skip to previous locality', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToNextLocality(); // to 2
        });

        await act(async () => {
            await result.current.skipToPreviousLocality(); // back to 1
        });

        expect(result.current.currentLocality?.locality_id).toBe('1');
        expect(result.current.currentTrack?.track_id).toBe('1');
    });

    it('should wrap to last locality when at first', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToPreviousLocality(); // wrap to 2
        });

        expect(result.current.currentLocality?.locality_id).toBe('2');
        expect(result.current.currentTrack?.track_id).toBe('3');
    });

    it('should show toast and end session on skipToPreviousLocality failure', async () => {
        (TrackPlayer.skip as jest.Mock).mockRejectedValueOnce(new Error('skip error'));

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        await act(async () => {
            await result.current.skipToPreviousLocality();
        });

        expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            text1: 'Playback error',
        }));

        expect(result.current.isSessionActive).toBe(false);
    });

    it('should update current locality and track on PlaybackActiveTrackChanged event', async () => {
        const useTrackPlayerEventsMock = jest.requireMock('react-native-track-player').useTrackPlayerEvents;

        let activeTrackChangedHandler: (event: PlaybackActiveTrackChangedEvent) => void;

        useTrackPlayerEventsMock.mockImplementation(
            (events: Event[], handler: (event: TrackPlayerEvent) => void) => {
                if (events.includes(Event.PlaybackActiveTrackChanged)) {
                    activeTrackChangedHandler = handler as (e: PlaybackActiveTrackChangedEvent) => void;
                }
            }
        );

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession(); // Start session with mockLocalities
        });

        await act(async () => {
            activeTrackChangedHandler!({
                type: Event.PlaybackActiveTrackChanged,
                track: { id: '1:2' }, // Locality 1, Track 2
            });
        });

        expect(result.current.currentLocality?.locality_id).toBe('1');
        expect(result.current.currentTrack?.track_id).toBe('2');
    });

    it('should remove ghost locality when PlaybackActiveTrackChanged is triggered', async () => {
        const useTrackPlayerEventsMock = jest.requireMock('react-native-track-player').useTrackPlayerEvents;

        let activeTrackChangedHandler: (event: PlaybackActiveTrackChangedEvent) => void;

        useTrackPlayerEventsMock.mockImplementation(
            (events: Event[], handler: (event: TrackPlayerEvent) => void) => {
                if (events.includes(Event.PlaybackActiveTrackChanged)) {
                    activeTrackChangedHandler = handler as (e: PlaybackActiveTrackChangedEvent) => void;
                }
            }
        );

        const ghostTrack = {
            track_id: '1',
            name: 'Ghost Track',
            artists: ['Ghost Artist'],
            preview_url: 'https://ghost.mp3',
            cover: { large: 'https://ghost.jpg' },
        };

        const ghostLocality = {
            locality_id: 'ghost-123',
            name: 'Ghostville',
            tracks: [ghostTrack],
        };

        const realTrack = {
            track_id: '2',
            name: 'Real Track',
            artists: ['Real Artist'],
            preview_url: 'https://real.mp3',
            cover: { large: 'https://real.jpg' },
        };

        const realLocality = {
            locality_id: '1',
            name: 'Realville',
            tracks: [realTrack],
        };

        // Mock getTracksForLocalities to return [ghost, real]
        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValue({
            data: [ghostLocality, realLocality],
        });

        // Pretend queue has both tracks
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
            { id: 'ghost-123:1' },
            { id: '1:2' },
        ]);

        const { result } = renderHook(() => usePlayer(), { wrapper });

        // Start session
        await act(async () => {
            await result.current.toggleSession();
        });

        // Simulate track change to the non-ghost track
        await act(async () => {
            activeTrackChangedHandler!({
                type: Event.PlaybackActiveTrackChanged,
                track: { id: '1:2' },
            });
        });

        // Ghost track should be removed from queue
        expect(TrackPlayer.remove).toHaveBeenCalledWith(0);

        // State should now reflect the real locality and track
        expect(result.current.currentLocality?.locality_id).toBe('1');
        expect(result.current.currentTrack?.track_id).toBe('2');
    });

    it('should fallback without update if PlaybackActiveTrackChanged does not match any track', async () => {
        const useTrackPlayerEventsMock = jest.requireMock('react-native-track-player').useTrackPlayerEvents;

        let activeTrackChangedHandler: (event: any) => void;

        useTrackPlayerEventsMock.mockImplementation(
            (events: Event[], handler: (event: TrackPlayerEvent) => void) => {
                if (events.includes(Event.PlaybackActiveTrackChanged)) {
                    activeTrackChangedHandler = handler as (e: PlaybackActiveTrackChangedEvent) => void;
                }
            }
        );

        const { result } = renderHook(() => usePlayer(), { wrapper });

        await act(async () => {
            await result.current.toggleSession();
        });

        const initialLocality = result.current.currentLocality;
        const initialTrack = result.current.currentTrack;

        await act(async () => {
            activeTrackChangedHandler!({
                type: Event.PlaybackActiveTrackChanged,
                track: { id: '999:999' }, // not matching any locality or track
            });
        });

        expect(result.current.currentLocality).toEqual(initialLocality);
        expect(result.current.currentTrack).toEqual(initialTrack);
    });

    it('should end session when only ghost locality remains and queue ends', async () => {
        const useTrackPlayerEventsMock = jest.requireMock('react-native-track-player').useTrackPlayerEvents;

        let queueEndedHandler: (event: PlaybackQueueEndedEvent) => void;

        useTrackPlayerEventsMock.mockImplementation(
            (events: Event[], handler: (event: TrackPlayerEvent) => void) => {
                if (events.includes(Event.PlaybackQueueEnded)) {
                    queueEndedHandler = handler as (e: PlaybackQueueEndedEvent) => void;
                }
            }
        );

        const ghostTrack = {
            track_id: 'ghost',
            name: 'Ghost Track',
            artists: ['Ghost Artist'],
            preview_url: 'https://ghost.mp3',
            cover: { large: 'https://ghost.jpg' },
        };

        const ghostLocality = {
            locality_id: 'ghost-123',
            name: 'Ghostville',
            tracks: [ghostTrack],
        };

        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValue({
            data: [ghostLocality],
        });

        (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
            { id: 'ghost-123:ghost' },
        ]);

        const { result } = renderHook(() => usePlayer(), { wrapper });

        // Start session (will pick up ghost locality)
        await act(async () => {
            await result.current.toggleSession();
        });

        // Manually simulate PlaybackQueueEnded
        await act(async () => {
            queueEndedHandler!({ type: Event.PlaybackQueueEnded });
        });

        expect(Toast.show).toHaveBeenCalledWith({
            type: 'info',
            text1: 'Listening session ended',
            text2: 'No other tracks found nearby.',
        });

        expect(TrackPlayer.reset).toHaveBeenCalled();
    });

    it('should handle radius changes and refresh tracks', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        // Start a session
        await act(async () => {
            await result.current.toggleSession();
        });

        // Change radius
        act(() => {
            result.current.setRadius(10000);
        });

        // Fast forward the debounce timer
        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        // Verify toast was shown
        expect(Toast.show).toHaveBeenCalledWith({
            type: 'info',
            text1: 'Search radius updated',
            text2: 'Refreshing tracks based on new location.'
        });

        // Verify tracks were refreshed
        expect(localityService.getTracksForLocalities).toHaveBeenCalledWith(
            mockUserLocation.coords.latitude,
            mockUserLocation.coords.longitude,
            10000
        );
    });

    it('should show error toast if radius-based track refresh fails', async () => {
        const { result } = renderHook(() => usePlayer(), { wrapper });

        // Start session successfully
        await act(async () => {
            await result.current.toggleSession();
        });

        // Mock the next track refresh (radius change) to return no data
        (localityService.getTracksForLocalities as jest.Mock).mockResolvedValueOnce({ data: [] });

        // Change radius
        act(() => {
            result.current.setRadius(9999);
        });

        // Fast-forward debounce
        await act(async () => {
            jest.advanceTimersByTime(500);
        });

        expect(Toast.show).toHaveBeenCalledWith({
            type: 'error',
            text1: 'Track refresh failed',
            text2: 'Could not refresh tracks after radius change.',
        });
    });

    it('should end session when navigating to auth', async () => {
        let pathname = '/';
        (usePathname as jest.Mock).mockImplementation(() => pathname);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <PlayerProvider>{children}</PlayerProvider>
        );

        const { result, rerender } = renderHook(() => usePlayer(), { wrapper });

        // Start a session
        await act(async () => {
            await result.current.toggleSession();
        });

        expect(result.current.isSessionActive).toBe(true);

        // Simulate navigation
        pathname = '/auth/login';
        rerender({ children: null }); // Trigger re-evaluation of usePathname and useEffect

        // Wait for effect to run
        await act(async () => {
            jest.advanceTimersByTime(0);
        });

        expect(result.current.isSessionActive).toBe(false);
        expect(TrackPlayer.reset).toHaveBeenCalled();
    });

    it('should initialise TrackPlayer on mount', async () => {
        // Mock TrackPlayer.reset to throw
        (TrackPlayer.reset as jest.Mock).mockRejectedValueOnce(new Error('Not initialized'));

        const { result } = renderHook(() => usePlayer(), { wrapper });

        // Wait for the setup effect to run
        await act(async () => {
            jest.advanceTimersByTime(0);
        });

        // Verify setup was called
        expect(TrackPlayer.setupPlayer).toHaveBeenCalled();
        expect(TrackPlayer.updateOptions).toHaveBeenCalledWith({
            android: {
                appKilledPlaybackBehavior: 'stop-playback-and-remove-notification',
                alwaysPauseOnInterruption: true,
                stopForegroundGracePeriod: 0
            }
        });
    });

    it('should end session on unmount if sessionIdRef is set', async () => {
        const { result, unmount } = renderHook(() => usePlayer(), { wrapper });

        // Start a session (increments sessionIdRef.current from 0)
        await act(async () => {
            await result.current.toggleSession();
        });

        // Unmount the component — should trigger the cleanup logic
        await act(async () => {
            unmount();
        });

        expect(TrackPlayer.reset).toHaveBeenCalled(); // Confirms `endSession()` was called on unmount
    });
}); 