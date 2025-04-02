import { authService } from '@/api/authService';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Animated } from 'react-native';
import { CompleteSpotifyModal } from '../../../src/components/auth/CompleteSpotifyModal';

// Mock authService
jest.mock('@/api/authService', () => ({
    authService: {
        completeSpotify: jest.fn(),
    },
}));

// Mock axios
jest.mock('axios', () => ({
    isAxiosError: (error: any) => error.isAxiosError,
}));

// Mock the instanceof check
const originalInstanceOf = Object.prototype.hasOwnProperty.call(Symbol, 'hasInstance')
    ? Symbol.hasInstance
    : 'instanceof';

// Create a mock AxiosError class
class MockAxiosError extends Error {
    isAxiosError = true;
    response?: any;
    constructor(response: any) {
        super();
        this.response = response;
    }
}

// Mock react-native
jest.mock('react-native', () => {
    const React = require('react');
    return {
        View: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
        Text: React.forwardRef((props: any, ref: any) => React.createElement('Text', { ...props, ref })),
        TextInput: React.forwardRef((props: any, ref: any) => React.createElement('TextInput', { ...props, ref })),
        TouchableOpacity: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
        ActivityIndicator: React.forwardRef((props: any, ref: any) => React.createElement('View', { ...props, ref })),
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
        Dimensions: {
            get: jest.fn().mockReturnValue({ height: 800 }),
        },
    };
});

describe('CompleteSpotifyModal', () => {
    const mockOnClose = jest.fn();
    const mockSetAuthData = jest.fn();
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
            <CompleteSpotifyModal isVisible={false} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        expect(queryByTestId('complete-spotify-modal')).toBeNull();
    });

    it('renders correctly when visible', async () => {
        const { getByTestId } = render(
            <CompleteSpotifyModal isVisible={true} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(getByTestId('complete-spotify-modal')).toBeTruthy();
    });

    it('animates correctly when opened', async () => {
        render(
            <CompleteSpotifyModal isVisible={true} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockSlideAnim._value).toBe(0);
        expect(mockFadeAnim._value).toBe(1);
    });

    it('shows validation error when username is too short', async () => {
        const { getByTestId, getByText } = render(
            <CompleteSpotifyModal isVisible={true} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const input = getByTestId('username-input');
        fireEvent.changeText(input, 'ab');
        fireEvent(input, 'focus');

        // Wait for the error to be displayed
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const errorBox = getByTestId('error-box');
        expect(errorBox).toBeTruthy();
        expect(getByText(/Username must be at least 3 characters long/)).toBeTruthy();
    });

    it('shows validation error when username contains invalid characters', async () => {
        const { getByTestId, getByText } = render(
            <CompleteSpotifyModal isVisible={true} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const input = getByTestId('username-input');
        fireEvent.changeText(input, 'test@user');
        fireEvent(input, 'focus');

        // Wait for the error to be displayed
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const errorBox = getByTestId('error-box');
        expect(errorBox).toBeTruthy();
        expect(getByText(/Username can only contain alphanumeric characters and underscores/)).toBeTruthy();
    });

    it('handles successful username submission', async () => {
        const mockUserDetails = { username: 'testuser' };
        (authService.completeSpotify as jest.Mock).mockResolvedValueOnce({ data: { user_details: mockUserDetails } });

        const { getByTestId } = render(
            <CompleteSpotifyModal isVisible={true} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const input = getByTestId('username-input');
        fireEvent.changeText(input, 'testuser');
        fireEvent(input, 'focus');

        const saveButton = getByTestId('save-username-button');
        await act(async () => {
            fireEvent.press(saveButton);
        });

        expect(authService.completeSpotify).toHaveBeenCalledWith('testuser');
        expect(mockSetAuthData).toHaveBeenCalledWith(mockUserDetails);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles API error during username submission', async () => {
        const mockError = {
            isAxiosError: true,
            response: {
                data: {
                    detail: 'Username already taken'
                }
            }
        };
        (authService.completeSpotify as jest.Mock).mockRejectedValueOnce(mockError);

        const { getByTestId, getByText } = render(
            <CompleteSpotifyModal isVisible={true} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const input = getByTestId('username-input');
        fireEvent.changeText(input, 'testuser');
        fireEvent(input, 'focus');

        const saveButton = getByTestId('save-username-button');
        await act(async () => {
            fireEvent.press(saveButton);
        });

        // Wait for the error to be displayed
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const errorBox = getByTestId('error-box');
        expect(errorBox).toBeTruthy();
        expect(getByText(/Username already taken/)).toBeTruthy();
    });

    it('handles unexpected errors during username submission', async () => {
        const mockError = new Error('Network error');
        (authService.completeSpotify as jest.Mock).mockRejectedValueOnce(mockError);

        const { getByTestId, getByText } = render(
            <CompleteSpotifyModal isVisible={true} onClose={mockOnClose} setAuthData={mockSetAuthData} />
        );
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const input = getByTestId('username-input');
        fireEvent.changeText(input, 'testuser');
        fireEvent(input, 'focus');

        const saveButton = getByTestId('save-username-button');
        await act(async () => {
            fireEvent.press(saveButton);
        });

        // Wait for the error to be displayed
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const errorBox = getByTestId('error-box');
        expect(errorBox).toBeTruthy();
        expect(getByText(/An unexpected error occurred/)).toBeTruthy();
    });
}); 