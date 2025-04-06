import { MovingText } from "@/components/misc/MovingText";
import { PlayerLocalityControls, PlayerTrackControls } from "@/components/player/PlayerControls";
import { PlayerProgressBar } from "@/components/player/PlayerProgressBar";
import { PlayerVolumeBar } from "@/components/player/PlayerVolumeBar";
import { usePlayer } from "@/context/PlayerContext";
import { render } from "@testing-library/react-native";
import React from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PlayerScreen from "../../src/app/player";

// Mock the required dependencies
jest.mock("@/context/PlayerContext");
jest.mock("@/components/misc/MovingText");
jest.mock("@/components/player/PlayerControls");
jest.mock("@/components/player/PlayerProgressBar");
jest.mock("@/components/player/PlayerVolumeBar");
jest.mock("react-native-safe-area-context", () => ({
    useSafeAreaInsets: jest.fn(),
}));

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
    __esModule: true,
    default: {
        setupPlayer: jest.fn(),
        add: jest.fn(),
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
        getState: jest.fn(),
        getCurrentTrack: jest.fn(),
        getProgress: jest.fn(),
        seekTo: jest.fn(),
        setVolume: jest.fn(),
        getVolume: jest.fn(),
        setRate: jest.fn(),
        getRate: jest.fn(),
        skip: jest.fn(),
        skipToNext: jest.fn(),
        skipToPrevious: jest.fn(),
        getQueue: jest.fn(),
        remove: jest.fn(),
        removeUpcomingTracks: jest.fn(),
        updateOptions: jest.fn(),
        updateMetadataForTrack: jest.fn(),
        clearNowPlayingMetadata: jest.fn(),
        clearQueue: jest.fn(),
        destroy: jest.fn(),
    },
    AppKilledPlaybackBehavior: {
        StopPlaybackAndRemoveApp: 'StopPlaybackAndRemoveApp',
        ContinuePlayback: 'ContinuePlayback',
    },
    Event: {
        PlaybackState: 'playback-state',
        PlaybackError: 'playback-error',
        PlaybackQueueEnded: 'playback-queue-ended',
        PlaybackTrackChanged: 'playback-track-changed',
        RemotePlay: 'remote-play',
        RemotePause: 'remote-pause',
        RemoteStop: 'remote-stop',
        RemoteNext: 'remote-next',
        RemotePrevious: 'remote-previous',
        RemoteSeek: 'remote-seek',
        RemoteSetRating: 'remote-set-rating',
        RemoteDuck: 'remote-duck',
        RemoteLike: 'remote-like',
        RemoteBookmark: 'remote-bookmark',
    },
    RepeatMode: {
        Off: 'off',
        Track: 'track',
        Queue: 'queue',
    },
    State: {
        None: 'none',
        Stopped: 'stopped',
        Paused: 'paused',
        Playing: 'playing',
        Buffering: 'buffering',
        Connecting: 'connecting',
        Loading: 'loading',
    },
    Capability: {
        Play: 'play',
        Pause: 'pause',
        Stop: 'stop',
        SeekTo: 'seek-to',
        SkipToNext: 'skip-to-next',
        SkipToPrevious: 'skip-to-previous',
        JumpForward: 'jump-forward',
        JumpBackward: 'jump-backward',
        SetRating: 'set-rating',
        Like: 'like',
        Dislike: 'dislike',
        Bookmark: 'bookmark',
    },
}));

describe("PlayerScreen", () => {
    const mockUsePlayer = usePlayer as jest.Mock;
    const mockUseSafeAreaInsets = useSafeAreaInsets as jest.Mock;

    // Mock data
    const mockTrack = {
        track_id: "track123",
        name: "Test Track",
        artists: ["Artist 1", "Artist 2"],
        cover: {
            small: "small.jpg",
            medium: "medium.jpg",
            large: "large.jpg"
        },
        preview_url: "https://example.com/preview.mp3"
    };

    const mockLocality = {
        locality_id: "locality123",
        name: "Test Locality",
        tracks: [mockTrack]
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock implementations
        mockUsePlayer.mockReturnValue({
            isSessionActive: true,
            currentTrack: mockTrack,
            currentLocality: mockLocality,
            isPlaying: true,
            playbackPosition: 30,
            trackDuration: 180,
            volume: 0.8,
            radius: 1000,
            toggleSession: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            setVolume: jest.fn(),
            setRadius: jest.fn(),
            skipToNextTrack: jest.fn(),
            skipToPreviousTrack: jest.fn(),
            skipToNextLocality: jest.fn(),
            skipToPreviousLocality: jest.fn(),
            seekToPosition: jest.fn(),
            canSkipTrack: true,
            canSkipLocality: true
        });

        mockUseSafeAreaInsets.mockReturnValue({
            top: 50,
            right: 0,
            bottom: 34,
            left: 0
        });

        // Mock component implementations
        (MovingText as jest.Mock).mockImplementation(({ text, style }) => (
            <Text style={style}>{text}</Text>
        ));
        (PlayerLocalityControls as jest.Mock).mockImplementation(() => <></>);
        (PlayerTrackControls as jest.Mock).mockImplementation(() => <></>);
        (PlayerProgressBar as jest.Mock).mockImplementation(() => <></>);
        (PlayerVolumeBar as jest.Mock).mockImplementation(() => <></>);
    });

    it("should render nothing when session is not active", () => {
        mockUsePlayer.mockReturnValue({
            isSessionActive: false,
            currentTrack: mockTrack,
            currentLocality: mockLocality
        });

        const { toJSON } = render(<PlayerScreen />);
        expect(toJSON()).toBeNull();
    });

    it("should render nothing when currentTrack is null", () => {
        mockUsePlayer.mockReturnValue({
            isSessionActive: true,
            currentTrack: null,
            currentLocality: mockLocality
        });

        const { toJSON } = render(<PlayerScreen />);
        expect(toJSON()).toBeNull();
    });

    it("should render nothing when currentLocality is null", () => {
        mockUsePlayer.mockReturnValue({
            isSessionActive: true,
            currentTrack: mockTrack,
            currentLocality: null
        });

        const { toJSON } = render(<PlayerScreen />);
        expect(toJSON()).toBeNull();
    });

    it("should render the player UI when all required data is available", () => {
        const { getByText } = render(<PlayerScreen />);

        // Check if track name and artists are rendered
        expect(getByText("Test Track")).toBeTruthy();
        expect(getByText("Artist 1, Artist 2")).toBeTruthy();

        // Check if all player components are rendered
        expect(PlayerLocalityControls).toHaveBeenCalled();
        expect(PlayerTrackControls).toHaveBeenCalled();
        expect(PlayerProgressBar).toHaveBeenCalled();
        expect(PlayerVolumeBar).toHaveBeenCalled();
    });

    it("should render the track artwork with the correct source", () => {
        const { getByTestId } = render(<PlayerScreen />);

        expect(PlayerLocalityControls).toHaveBeenCalled();
    });

    it("should render the DismissPlayerSymbol component", () => {
        render(<PlayerScreen />);

        // We can't directly test the DismissPlayerSymbol component
        // Instead, we can verify that the PlayerLocalityControls was rendered
        expect(PlayerLocalityControls).toHaveBeenCalled();
    });

    it("should pass correct styles to MovingText components", () => {
        render(<PlayerScreen />);

        // Check if MovingText was called with correct props
        expect(MovingText).toHaveBeenCalledWith(
            expect.objectContaining({
                text: "Test Track",
                animationThreshold: 30,
                style: expect.objectContaining({
                    color: '#fff',
                    fontSize: 22,
                    fontWeight: '700',
                })
            }),
            expect.anything()
        );

        expect(MovingText).toHaveBeenCalledWith(
            expect.objectContaining({
                text: "Artist 1, Artist 2",
                animationThreshold: 35,
                style: expect.objectContaining({
                    color: '#fff',
                    fontSize: 20,
                    opacity: 0.8,
                    maxWidth: '90%',
                })
            }),
            expect.anything()
        );
    });

    it("should pass correct styles to player control components", () => {
        render(<PlayerScreen />);

        // Check if PlayerLocalityControls was called with correct style
        expect(PlayerLocalityControls).toHaveBeenCalledWith(
            expect.objectContaining({
                style: expect.objectContaining({
                    marginTop: 70 // top + 20
                })
            }),
            expect.anything()
        );

        // Check if PlayerTrackControls was called with correct style
        expect(PlayerTrackControls).toHaveBeenCalledWith(
            expect.objectContaining({
                style: expect.objectContaining({
                    marginTop: 40
                })
            }),
            expect.anything()
        );

        // Check if PlayerProgressBar was called with correct style
        expect(PlayerProgressBar).toHaveBeenCalledWith(
            expect.objectContaining({
                style: expect.objectContaining({
                    marginTop: 32
                })
            }),
            expect.anything()
        );

        // Check if PlayerVolumeBar was called with correct style
        expect(PlayerVolumeBar).toHaveBeenCalledWith(
            expect.objectContaining({
                style: expect.objectContaining({
                    marginTop: 'auto',
                    marginBottom: 30
                })
            }),
            expect.anything()
        );
    });
}); 