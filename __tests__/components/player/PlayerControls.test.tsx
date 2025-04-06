import { usePlayer } from '@/context/PlayerContext';
import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    GoToLocalityButton,
    PlayerLocalityControls,
    PlayerTrackControls,
    PlayPauseButton,
    SkipToNextLocalityButton,
    SkipToNextTrackButton,
    SkipToPreviousLocalityButton,
    SkipToPreviousTrackButton,
} from '../../../src/components/player/PlayerControls';

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
    FontAwesome6: 'FontAwesome6',
}));

describe('PlayerControls', () => {
    const mockPause = jest.fn();
    const mockResume = jest.fn();
    const mockSkipToNextTrack = jest.fn();
    const mockSkipToPreviousTrack = jest.fn();
    const mockSkipToNextLocality = jest.fn();
    const mockSkipToPreviousLocality = jest.fn();
    const mockRouterPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (usePlayer as jest.Mock).mockReturnValue({
            isPlaying: false,
            pause: mockPause,
            resume: mockResume,
            canSkipTrack: true,
            skipToNextTrack: mockSkipToNextTrack,
            skipToPreviousTrack: mockSkipToPreviousTrack,
            canSkipLocality: true,
            skipToNextLocality: mockSkipToNextLocality,
            skipToPreviousLocality: mockSkipToPreviousLocality,
            currentLocality: {
                locality_id: '123',
                name: 'Test Locality',
            },
        });
        (useRouter as jest.Mock).mockReturnValue({
            push: mockRouterPush,
        });
    });

    describe('PlayPauseButton', () => {
        it('renders play button when not playing', () => {
            const { getByTestId } = render(<PlayPauseButton />);
            expect(getByTestId('play-pause-button')).toBeTruthy();
        });

        it('renders pause button when playing', () => {
            (usePlayer as jest.Mock).mockReturnValue({
                isPlaying: true,
                pause: mockPause,
                resume: mockResume,
            });
            const { getByTestId } = render(<PlayPauseButton />);
            expect(getByTestId('play-pause-button')).toBeTruthy();
        });

        it('calls resume when pressed while not playing', () => {
            const { getByTestId } = render(<PlayPauseButton />);
            fireEvent.press(getByTestId('play-pause-button'));
            expect(mockResume).toHaveBeenCalled();
        });

        it('calls pause when pressed while playing', () => {
            (usePlayer as jest.Mock).mockReturnValue({
                isPlaying: true,
                pause: mockPause,
                resume: mockResume,
            });
            const { getByTestId } = render(<PlayPauseButton />);
            fireEvent.press(getByTestId('play-pause-button'));
            expect(mockPause).toHaveBeenCalled();
        });
    });

    describe('SkipToNextTrackButton', () => {
        it('renders enabled when canSkipTrack is true', () => {
            const { getByTestId } = render(<SkipToNextTrackButton />);
            const button = getByTestId('skip-next-track-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
        });

        it('renders disabled when canSkipTrack is false', () => {
            (usePlayer as jest.Mock).mockReturnValue({
                canSkipTrack: false,
                skipToNextTrack: mockSkipToNextTrack,
            });
            const { getByTestId } = render(<SkipToNextTrackButton />);
            const button = getByTestId('skip-next-track-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 0.5 }));
        });

        it('calls skipToNextTrack when pressed', () => {
            const { getByTestId } = render(<SkipToNextTrackButton />);
            fireEvent.press(getByTestId('skip-next-track-button'));
            expect(mockSkipToNextTrack).toHaveBeenCalled();
        });
    });

    describe('SkipToPreviousTrackButton', () => {
        it('renders enabled when canSkipTrack is true', () => {
            const { getByTestId } = render(<SkipToPreviousTrackButton />);
            const button = getByTestId('skip-previous-track-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
        });

        it('renders disabled when canSkipTrack is false', () => {
            (usePlayer as jest.Mock).mockReturnValue({
                canSkipTrack: false,
                skipToPreviousTrack: mockSkipToPreviousTrack,
            });
            const { getByTestId } = render(<SkipToPreviousTrackButton />);
            const button = getByTestId('skip-previous-track-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 0.5 }));
        });

        it('calls skipToPreviousTrack when pressed', () => {
            const { getByTestId } = render(<SkipToPreviousTrackButton />);
            fireEvent.press(getByTestId('skip-previous-track-button'));
            expect(mockSkipToPreviousTrack).toHaveBeenCalled();
        });
    });

    describe('GoToLocalityButton', () => {
        it('renders null when no currentLocality', () => {
            (usePlayer as jest.Mock).mockReturnValue({
                currentLocality: null,
            });
            const { queryByTestId } = render(<GoToLocalityButton />);
            expect(queryByTestId('go-to-locality-button')).toBeNull();
        });

        it('renders locality name and navigates when pressed', () => {
            const { getByTestId, getByText } = render(<GoToLocalityButton />);
            expect(getByText('PLAYING FROM:')).toBeTruthy();
            expect(getByText('Test Locality')).toBeTruthy();

            fireEvent.press(getByTestId('go-to-locality-button'));
            expect(mockRouterPush).toHaveBeenCalledWith({
                pathname: '/localities/[id]',
                params: {
                    id: '123',
                    name: 'Test Locality',
                },
            });
        });
    });

    describe('SkipToNextLocalityButton', () => {
        it('renders enabled when canSkipLocality is true', () => {
            const { getByTestId } = render(<SkipToNextLocalityButton />);
            const button = getByTestId('skip-next-locality-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
        });

        it('renders disabled when canSkipLocality is false', () => {
            (usePlayer as jest.Mock).mockReturnValue({
                canSkipLocality: false,
                skipToNextLocality: mockSkipToNextLocality,
            });
            const { getByTestId } = render(<SkipToNextLocalityButton />);
            const button = getByTestId('skip-next-locality-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 0.5 }));
        });

        it('calls skipToNextLocality when pressed', () => {
            const { getByTestId } = render(<SkipToNextLocalityButton />);
            fireEvent.press(getByTestId('skip-next-locality-button'));
            expect(mockSkipToNextLocality).toHaveBeenCalled();
        });
    });

    describe('SkipToPreviousLocalityButton', () => {
        it('renders enabled when canSkipLocality is true', () => {
            const { getByTestId } = render(<SkipToPreviousLocalityButton />);
            const button = getByTestId('skip-previous-locality-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 1 }));
        });

        it('renders disabled when canSkipLocality is false', () => {
            (usePlayer as jest.Mock).mockReturnValue({
                canSkipLocality: false,
                skipToPreviousLocality: mockSkipToPreviousLocality,
            });
            const { getByTestId } = render(<SkipToPreviousLocalityButton />);
            const button = getByTestId('skip-previous-locality-button');
            expect(button.props.style).toEqual(expect.objectContaining({ opacity: 0.5 }));
        });

        it('calls skipToPreviousLocality when pressed', () => {
            const { getByTestId } = render(<SkipToPreviousLocalityButton />);
            fireEvent.press(getByTestId('skip-previous-locality-button'));
            expect(mockSkipToPreviousLocality).toHaveBeenCalled();
        });
    });

    describe('PlayerTrackControls', () => {
        it('renders all track control buttons', () => {
            const { getByTestId } = render(<PlayerTrackControls />);
            expect(getByTestId('play-pause-button')).toBeTruthy();
            expect(getByTestId('skip-next-track-button')).toBeTruthy();
            expect(getByTestId('skip-previous-track-button')).toBeTruthy();
        });

        it('applies custom styles', () => {
            const customStyle = { marginTop: 20 };
            const { getByTestId } = render(<PlayerTrackControls style={customStyle} />);
            const container = getByTestId('player-track-controls');
            expect(container.props.style).toEqual(expect.arrayContaining([expect.objectContaining(customStyle)]));
        });
    });

    describe('PlayerLocalityControls', () => {
        it('renders all locality control buttons', () => {
            const { getByTestId } = render(<PlayerLocalityControls />);
            expect(getByTestId('go-to-locality-button')).toBeTruthy();
            expect(getByTestId('skip-next-locality-button')).toBeTruthy();
            expect(getByTestId('skip-previous-locality-button')).toBeTruthy();
        });

        it('applies custom styles', () => {
            const customStyle = { marginTop: 20 };
            const { getByTestId } = render(<PlayerLocalityControls style={customStyle} />);
            const container = getByTestId('player-locality-controls');
            expect(container.props.style).toEqual(expect.arrayContaining([expect.objectContaining(customStyle)]));
        });
    });
}); 