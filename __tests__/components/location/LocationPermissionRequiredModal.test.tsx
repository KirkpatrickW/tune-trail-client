import { act, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';
import { LocationPermissionRequiredModal } from '../../../src/components/location/LocationPermissionRequiredModal';

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
        Text: React.forwardRef((props: any, ref: any) => React.createElement('Text', { ...props, ref })),
        Dimensions: {
            get: jest.fn().mockReturnValue({ height: 800 }),
        },
    };
});

describe('LocationPermissionRequiredModal', () => {
    const mockScreenHeight = 800;
    const mockSlideAnim = { _value: mockScreenHeight };
    const mockFadeAnim = { _value: 0 };

    beforeEach(() => {
        jest.clearAllMocks();
        (Animated.Value as jest.Mock)
            .mockReturnValueOnce(mockSlideAnim)
            .mockReturnValueOnce(mockFadeAnim);
    });

    it('renders nothing when permission is granted', () => {
        const { queryByTestId } = render(
            <LocationPermissionRequiredModal permissionGranted={true} />
        );
        expect(queryByTestId('location-permission-modal')).toBeNull();
    });

    it('renders nothing when permission is null', () => {
        const { queryByTestId } = render(
            <LocationPermissionRequiredModal permissionGranted={null} />
        );
        expect(queryByTestId('location-permission-modal')).toBeNull();
    });

    it('renders correctly when permission is not granted', async () => {
        const { getByTestId } = render(
            <LocationPermissionRequiredModal permissionGranted={false} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('location-permission-modal')).toBeTruthy();
    });

    it('animates correctly when opened', async () => {
        render(
            <LocationPermissionRequiredModal permissionGranted={false} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockSlideAnim._value).toBe(0);
        expect(mockFadeAnim._value).toBe(1);
    });

    it('closes when permission is granted', async () => {
        const { getByTestId, rerender } = render(
            <LocationPermissionRequiredModal permissionGranted={false} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('location-permission-modal')).toBeTruthy();

        rerender(
            <LocationPermissionRequiredModal permissionGranted={true} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockSlideAnim._value).toBe(mockScreenHeight);
        expect(mockFadeAnim._value).toBe(0);
    });
}); 