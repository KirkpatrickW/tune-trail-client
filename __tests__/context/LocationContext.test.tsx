import { act, render, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import React from 'react';
import { AppState, Text, View } from 'react-native';
import { LocationProvider, useLocation } from '../../src/context/LocationContext';

// ✅ Mock expo-location with safe defaults
jest.mock('expo-location', () => ({
    getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'undetermined' }),
    getCurrentPositionAsync: jest.fn(),
    watchPositionAsync: jest.fn(),
    Accuracy: {
        High: 'high',
    },
}));

// ✅ Mock LocationPermissionRequiredModal
jest.mock('../../src/components/location/LocationPermissionRequiredModal', () => ({
    LocationPermissionRequiredModal: () => null,
}));

// ✅ Proper AppState mock with .remove()
jest.mock('react-native/Libraries/AppState/AppState', () => ({
    addEventListener: jest.fn(() => ({
        remove: jest.fn(),
    })),
    currentState: 'active',
}));

beforeAll(() => {
    // Silence noisy expected errors
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterAll(() => {
    (console.error as jest.Mock).mockRestore();
});

describe('LocationContext', () => {
    const mockLocation = {
        coords: {
            latitude: 37.78825,
            longitude: -122.4324,
            altitude: null,
            accuracy: 5,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
        },
        timestamp: 1234567890,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <LocationProvider>{children}</LocationProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        (AppState.addEventListener as jest.Mock).mockClear();
    });

    it('should provide location context with default permissionDenied and null location', async () => {
        const { result, unmount } = renderHook(() => useLocation(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.userLocation).toBeNull();
        expect(result.current.permissionGranted).toBe(false);

        await act(async () => {
            unmount();
        });
    });

    it('should throw error when used outside of provider', () => {
        expect(() => {
            renderHook(() => useLocation());
        }).toThrow('useLocation must be used within a LocationProvider');
    });

    it('should handle permission granted', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);

        const { result, unmount } = renderHook(() => useLocation(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.permissionGranted).toBe(true);
        expect(result.current.userLocation).toEqual(mockLocation);

        await act(async () => {
            unmount();
        });
    });

    it('should handle permission denied', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

        const { result, unmount } = renderHook(() => useLocation(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.permissionGranted).toBe(false);
        expect(result.current.userLocation).toBeNull();

        await act(async () => {
            unmount();
        });
    });

    it('should update location when app becomes active', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);

        const { result, unmount } = renderHook(() => useLocation(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            const callback = (AppState.addEventListener as jest.Mock).mock.calls[0][1];
            callback('active');
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(Location.getForegroundPermissionsAsync).toHaveBeenCalledTimes(2);
        expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(2);

        await act(async () => {
            unmount();
        });
    });

    it('should render children', () => {
        const TestChild = () => (
            <View>
                <Text>Test Child</Text>
            </View>
        );

        const { getByText } = render(
            <LocationProvider>
                <TestChild />
            </LocationProvider>
        );

        expect(getByText('Test Child')).toBeTruthy();
    });

    it('should setup location watch when permission is granted', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);
        (Location.watchPositionAsync as jest.Mock).mockReturnValue({ remove: jest.fn() });

        const { unmount } = renderHook(() => useLocation(), { wrapper });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(Location.watchPositionAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10,
            }),
            expect.any(Function)
        );

        await act(async () => {
            unmount();
        });
    });

    it('should update location when watch callback is called', async () => {
        (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(mockLocation);

        let watchCallback: (location: any) => void;
        (Location.watchPositionAsync as jest.Mock).mockImplementation((options, callback) => {
            watchCallback = callback;
            return { remove: jest.fn() };
        });

        const { result } = renderHook(() => useLocation(), { wrapper });

        // Wait for initial setup
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Create a new location object
        const newLocation = {
            ...mockLocation,
            coords: {
                ...mockLocation.coords,
                latitude: 38.78825,
                longitude: -123.4324
            }
        };

        // Call the watch callback with new location
        await act(async () => {
            watchCallback(newLocation);
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.userLocation).toEqual(newLocation);
    });
});
