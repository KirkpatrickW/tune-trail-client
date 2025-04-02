import { usePlayer } from '@/context/PlayerContext';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { PlayerVolumeBar } from '../../../src/components/player/PlayerVolumeBar';

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
    };
});

// Mock react-native-awesome-slider
jest.mock('react-native-awesome-slider', () => {
    const React = require('react');
    return {
        Slider: ({ onValueChange, progress, minimumValue, maximumValue, renderBubble }: any) => {
            // Call renderBubble to get coverage
            renderBubble?.();

            return React.createElement('View', {
                testID: 'volume-slider',
                onValueChange: (value: number) => onValueChange(value),
                progress: progress.value,
                minimumValue: minimumValue.value,
                maximumValue: maximumValue.value,
                renderBubble,
            });
        },
    };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

describe('PlayerVolumeBar', () => {
    const mockSetVolume = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (usePlayer as jest.Mock).mockReturnValue({
            volume: 0.5,
            setVolume: mockSetVolume,
        });
    });

    it('renders volume bar with icons', () => {
        const { getByTestId } = render(<PlayerVolumeBar />);

        expect(getByTestId('volume-slider')).toBeTruthy();
    });

    it('updates volume when slider value changes', () => {
        const { getByTestId } = render(<PlayerVolumeBar />);

        const slider = getByTestId('volume-slider');
        fireEvent(slider, 'onValueChange', 0.75);

        expect(mockSetVolume).toHaveBeenCalledWith(0.75);
    });

    it('initializes with correct volume value', () => {
        (usePlayer as jest.Mock).mockReturnValue({
            volume: 0.3,
            setVolume: mockSetVolume,
        });

        const { getByTestId } = render(<PlayerVolumeBar />);
        const slider = getByTestId('volume-slider');

        expect(slider.props.progress).toBe(0.3);
    });

    it('handles null volume value', () => {
        (usePlayer as jest.Mock).mockReturnValue({
            volume: null,
            setVolume: mockSetVolume,
        });

        const { getByTestId } = render(<PlayerVolumeBar />);
        const slider = getByTestId('volume-slider');

        expect(slider.props.progress).toBe(0);
    });
}); 