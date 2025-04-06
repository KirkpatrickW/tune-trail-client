import { usePlayer } from '@/context/PlayerContext';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import RadiusSlider from '../../../src/components/maps/RadiusSlider';

// Mock the PlayerContext
jest.mock('@/context/PlayerContext', () => ({
    usePlayer: jest.fn(),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
    useSharedValue: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        FontAwesome6: () => React.createElement(View, { testID: 'mock-icon' }),
    };
});

// Mock react-native-awesome-slider
jest.mock('react-native-awesome-slider', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        Slider: ({
            onValueChange,
            progress,
            renderBubble,
            renderThumb
        }: {
            onValueChange: (value: number) => void;
            progress: { value: number };
            renderBubble?: () => React.ReactNode;
            renderThumb?: () => React.ReactNode;
        }) => {
            // Ensure renderThumb is called
            if (renderThumb) renderThumb();

            // Store the onValueChange callback
            const handleValueChange = (val: number) => {
                onValueChange(val);
            };

            return (
                <View testID="mock-slider">
                    <View
                        testID="mock-slider-thumb"
                        onTouchStart={() => handleValueChange(5000)}
                    />
                    {renderBubble && renderBubble()}
                </View>
            );
        },
    };
});

// Mock react-native
jest.mock('react-native', () => {
    const React = require('react');
    return {
        View: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
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
                    // Simulate animation immediately by calling the callback
                    value._value = config.toValue;
                    if (callback) callback({ finished: true });
                },
            })),
            parallel: jest.fn().mockImplementation((animations) => ({
                start: (callback?: (result: { finished: boolean }) => void) => {
                    animations.forEach((animation: { start: (callback?: (result: { finished: boolean }) => void) => void }) => animation.start());
                    if (callback) callback({ finished: true });
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
        TouchableOpacity: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
        Text: React.forwardRef((props: any, ref: any) => React.createElement('Text', { ...props, ref })),
        Platform: {
            OS: 'android',
            select: (obj: any) => obj.android,
        },
        NativeModules: {},
        NativeEventEmitter: jest.fn().mockImplementation(() => ({
            addListener: jest.fn(),
            removeListeners: jest.fn(),
        })),
    };
});

describe('RadiusSlider', () => {
    const mockSetRadius = jest.fn();
    const mockProgress = { value: 1000 };
    const mockAnimatedHeight = { _value: 0 };
    const mockAnimatedOpacity = { _value: 0 };

    beforeEach(() => {
        jest.clearAllMocks();
        (usePlayer as jest.Mock).mockReturnValue({
            radius: 1000,
            setRadius: mockSetRadius,
        });
        (useSharedValue as jest.Mock).mockReturnValue(mockProgress);
        (Animated.Value as jest.Mock)
            .mockReturnValueOnce(mockAnimatedHeight)
            .mockReturnValueOnce(mockAnimatedOpacity);
    });

    it('renders the toggle button', () => {
        const { getByTestId } = render(<RadiusSlider />);
        expect(getByTestId('radius-toggle-button')).toBeTruthy();
    });

    it('expands and collapses on toggle button press', async () => {
        const { getByTestId } = render(<RadiusSlider />);

        const toggleButton = getByTestId('radius-toggle-button');
        await act(async () => {
            fireEvent.press(toggleButton);
        });

        // After expansion, check values
        expect(mockAnimatedHeight._value).toBe(200);
        expect(mockAnimatedOpacity._value).toBe(1);

        // Collapse it
        await act(async () => {
            fireEvent.press(toggleButton);
        });

        // After collapse, check values
        expect(mockAnimatedHeight._value).toBe(0);
        expect(mockAnimatedOpacity._value).toBe(0);
    });

    it('updates both radius and progress value when slider changes', async () => {
        const { getByTestId } = render(<RadiusSlider />);

        // Expand the slider first
        const toggleButton = getByTestId('radius-toggle-button');
        await act(async () => {
            fireEvent.press(toggleButton);
        });

        // Simulate slider interaction
        const sliderThumb = getByTestId('mock-slider-thumb');
        await act(async () => {
            fireEvent(sliderThumb, 'touchStart');
        });

        // Verify both setRadius and progress.value are updated with the new value
        expect(mockSetRadius).toHaveBeenCalledWith(5000);
        expect(mockProgress.value).toBe(5000);
    });

    it('displays current radius value in bubble', async () => {
        const { getByTestId, getByText } = render(<RadiusSlider />);

        const toggleButton = getByTestId('radius-toggle-button');
        await act(async () => {
            fireEvent.press(toggleButton);
        });

        expect(getByText('1000m')).toBeTruthy();
    });
});
