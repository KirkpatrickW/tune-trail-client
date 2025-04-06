import { usePlayer } from '@/context/PlayerContext';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import * as Reanimated from 'react-native-reanimated';
import { PlayerProgressBar } from '../../../src/components/player/PlayerProgressBar';

// Mock the PlayerContext
jest.mock('@/context/PlayerContext', () => ({
    usePlayer: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const React = require('react');
    return {
        useSharedValue: jest.fn().mockImplementation((value) => ({
            value,
        })),
        useDerivedValue: jest.fn().mockImplementation((value) => ({
            value: value(),
        })),
        useAnimatedStyle: jest.fn().mockImplementation((callback) => {
            const result = callback();
            return result;
        }),
        View: 'Animated.View',
    };
});

// Mock react-native-awesome-slider
jest.mock('react-native-awesome-slider', () => {
    const React = require('react');
    return {
        Slider: ({
            onValueChange,
            onSlidingStart,
            onSlidingComplete,
            progress,
            minimumValue,
            maximumValue,
            renderBubble,
            containerStyle
        }: any) => {
            // Call renderBubble to get coverage
            renderBubble?.();

            return React.createElement('View', {
                testID: 'progress-slider',
                onValueChange: (value: number) => onValueChange(value),
                onSlidingStart: () => onSlidingStart(),
                onSlidingComplete: (value: number) => onSlidingComplete(value),
                progress: progress.value,
                minimumValue: minimumValue.value,
                maximumValue: maximumValue.value,
                renderBubble,
                style: containerStyle,
            });
        },
    };
});

describe('PlayerProgressBar', () => {
    const mockSeekToPosition = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (usePlayer as jest.Mock).mockReturnValue({
            trackDuration: 180, // 3 minutes
            playbackPosition: 30, // 30 seconds
            seekToPosition: mockSeekToPosition,
        });
    });

    it('renders in interactive mode by default', () => {
        const { getByTestId, getByText } = render(<PlayerProgressBar />);

        expect(getByTestId('progress-slider')).toBeTruthy();
        expect(getByText('00:30')).toBeTruthy();
        expect(getByText('- 02:30')).toBeTruthy();
    });

    it('renders in display-only mode', () => {
        const { queryByTestId } = render(<PlayerProgressBar displayOnly={true} />);

        expect(queryByTestId('progress-slider')).toBeNull();
        expect(Reanimated.useAnimatedStyle).toHaveBeenCalled();
    });

    it('updates progress when slider value changes', () => {
        const { getByTestId } = render(<PlayerProgressBar />);

        const slider = getByTestId('progress-slider');
        fireEvent(slider, 'onValueChange', 0.5);

        expect(mockSeekToPosition).toHaveBeenCalledWith(90); // 0.5 * 180
    });

    it('handles sliding start and complete', () => {
        const { getByTestId } = render(<PlayerProgressBar />);

        const slider = getByTestId('progress-slider');
        fireEvent(slider, 'onSlidingStart');
        fireEvent(slider, 'onSlidingComplete', 0.75);

        expect(mockSeekToPosition).toHaveBeenCalledWith(135); // 0.75 * 180
    });

    it('formats time correctly', () => {
        (usePlayer as jest.Mock).mockReturnValue({
            trackDuration: 125, // 2 minutes 5 seconds
            playbackPosition: 65, // 1 minute 5 seconds
            seekToPosition: mockSeekToPosition,
        });

        const { getByText } = render(<PlayerProgressBar />);

        expect(getByText('01:05')).toBeTruthy();
        expect(getByText('- 01:00')).toBeTruthy();
    });

    it('handles zero duration', () => {
        (usePlayer as jest.Mock).mockReturnValue({
            trackDuration: 0,
            playbackPosition: 0,
            seekToPosition: mockSeekToPosition,
        });

        const { getByText } = render(<PlayerProgressBar />);

        expect(getByText('00:00')).toBeTruthy();
        expect(getByText('- 00:00')).toBeTruthy();
    });

    it('applies custom styles', () => {
        const customStyle = { marginTop: 20 };
        const { getByTestId } = render(<PlayerProgressBar style={customStyle} />);

        const container = getByTestId('progress-container');
        expect(container.props.style).toEqual(customStyle);
    });
}); 