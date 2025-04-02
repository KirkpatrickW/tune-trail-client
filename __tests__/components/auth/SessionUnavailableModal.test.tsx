import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';
import SessionUnavailableModal from '../../../src/components/auth/SessionUnavailableModal';

// Mock expo-router
const mockRouterReplace = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({
        replace: mockRouterReplace,
    }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
    FontAwesome: () => 'mock-icon',
}));

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
        TouchableWithoutFeedback: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
        Text: React.forwardRef((props: any, ref: any) => React.createElement('Text', { ...props, ref })),
        Dimensions: {
            get: jest.fn().mockReturnValue({ height: 800 }),
        },
    };
});

describe('SessionUnavailableModal', () => {
    const mockOnClose = jest.fn();
    const mockScreenHeight = 800;
    const mockSlideAnim = { _value: mockScreenHeight };
    const mockFadeAnim = { _value: 0 };

    beforeEach(() => {
        jest.clearAllMocks();
        (Animated.Value as jest.Mock)
            .mockReturnValueOnce(mockSlideAnim)
            .mockReturnValueOnce(mockFadeAnim);
    });

    it('renders nothing when not visible', () => {
        const { queryByTestId } = render(
            <SessionUnavailableModal isVisible={false} onClose={mockOnClose} />
        );
        expect(queryByTestId('session-unavailable-modal')).toBeNull();
    });

    it('renders correctly when visible', async () => {
        const { getByTestId } = render(
            <SessionUnavailableModal isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('session-unavailable-modal')).toBeTruthy();
    });

    it('animates correctly when opened', async () => {
        render(
            <SessionUnavailableModal isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockSlideAnim._value).toBe(0);
        expect(mockFadeAnim._value).toBe(1);
    });

    it('closes when backdrop is pressed', async () => {
        const { getByTestId } = render(
            <SessionUnavailableModal isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const backdrop = getByTestId('session-unavailable-backdrop');
        await act(async () => {
            fireEvent.press(backdrop);
        });

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes when close button is pressed', async () => {
        const { getByTestId } = render(
            <SessionUnavailableModal isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const closeButton = getByTestId('session-unavailable-close');
        await act(async () => {
            fireEvent.press(closeButton);
        });

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('navigates to auth screen when sign in button is pressed', async () => {
        const { getByTestId } = render(
            <SessionUnavailableModal isVisible={true} onClose={mockOnClose} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const signInButton = getByTestId('session-unavailable-signin');
        await act(async () => {
            fireEvent.press(signInButton);
        });

        expect(mockRouterReplace).toHaveBeenCalledWith('/auth');
        expect(mockOnClose).toHaveBeenCalled();
    });
}); 