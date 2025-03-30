import { act, renderHook } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

// Mocks
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

// Modal mocks with onClose capture
const mockSpotifyOnClose = jest.fn();
const mockSessionOnClose = jest.fn();

jest.mock('../../src/components/auth/CompleteSpotifyModal', () => ({
    CompleteSpotifyModal: ({ onClose }: { onClose: () => void }) => {
        mockSpotifyOnClose.mockImplementation(onClose);
        return null;
    },
}));

jest.mock('../../src/components/auth/SessionUnavailableModal', () => ({
    __esModule: true,
    default: ({ onClose }: { onClose: () => void }) => {
        mockSessionOnClose.mockImplementation(onClose);
        return null;
    },
}));

describe('AuthContext', () => {
    const mockUserDetails = {
        user_id: '123',
        username: 'testuser',
        is_admin: false,
        is_oauth_account: false,
        spotify_subscription: null,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
        (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
        (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    });

    it('should provide initial null values when no stored data', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(result.current.accessToken).toBeNull();
        expect(result.current.userDetails).toBeNull();
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isSessionUnavailable).toBe(false);
        expect(result.current.isAuthLoaded).toBe(true);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isCompleteSpotifyModalVisible).toBe(false);
    });

    it('should load stored auth data on mount', async () => {
        const storedToken = 'stored-token';
        const storedUserDetails = { ...mockUserDetails, username: 'storeduser' };

        (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
            if (key === 'access_token') return Promise.resolve(storedToken);
            if (key === 'user_details') return Promise.resolve(JSON.stringify(storedUserDetails));
            return Promise.resolve(null);
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(result.current.accessToken).toBe(storedToken);
        expect(result.current.userDetails).toEqual(storedUserDetails);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('should throw error when used outside of provider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth must be used within an AuthProvider'
        );
        consoleError.mockRestore();
    });

    it('should set auth data', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        const newToken = 'new-token';
        const newUserDetails = { ...mockUserDetails, username: 'newuser' };

        await act(async () => {
            await result.current.setAuthData(newUserDetails, newToken);
        });

        expect(result.current.accessToken).toBe(newToken);
        expect(result.current.userDetails).toEqual(newUserDetails);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', newToken);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
            'user_details',
            JSON.stringify(newUserDetails)
        );
    });

    it('should clear auth data', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockImplementation((key) => {
            if (key === 'access_token') return Promise.resolve('token');
            if (key === 'user_details') return Promise.resolve(JSON.stringify(mockUserDetails));
            return Promise.resolve(null);
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.clearAuthData();
        });

        expect(result.current.accessToken).toBeNull();
        expect(result.current.userDetails).toBeNull();
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_details');
    });

    it('should show and hide SessionUnavailableModal', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        act(() => {
            result.current.showSessionUnavailableModal();
        });

        expect(result.current.isSessionUnavailable).toBe(true);

        act(() => {
            mockSessionOnClose(); // simulate modal closing
        });

        expect(result.current.isSessionUnavailable).toBe(false);
    });

    it('should show and hide CompleteSpotifyModal', async () => {
        const oauthUser = {
            ...mockUserDetails,
            is_oauth_account: true,
            username: null,
        };

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.setAuthData(oauthUser);
        });

        expect(result.current.isCompleteSpotifyModalVisible).toBe(true);

        act(() => {
            mockSpotifyOnClose(); // simulate modal closing
        });

        expect(result.current.isCompleteSpotifyModalVisible).toBe(false);
    });

    it('should not show CompleteSpotifyModal for non-oauth users', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.setAuthData(mockUserDetails);
        });

        expect(result.current.isCompleteSpotifyModalVisible).toBe(false);
    });

    it('should update isAdmin based on user details', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.setAuthData({ ...mockUserDetails, is_admin: true });
        });

        expect(result.current.isAdmin).toBe(true);

        await act(async () => {
            await result.current.setAuthData({ ...mockUserDetails, is_admin: false });
        });

        expect(result.current.isAdmin).toBe(false);
    });

    it('should merge partial user details with existing ones', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.setAuthData(mockUserDetails);
        });

        const partialUpdate = {
            username: 'updateduser',
            is_admin: true,
        };

        await act(async () => {
            await result.current.setAuthData(partialUpdate);
        });

        expect(result.current.userDetails).toEqual({
            ...mockUserDetails,
            username: 'updateduser',
            is_admin: true,
        });
    });

    it('should handle empty user details in setAuthData', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.setAuthData(mockUserDetails);
        });

        await act(async () => {
            await result.current.setAuthData({});
        });

        expect(result.current.userDetails).toEqual(mockUserDetails);
    });

    it('should handle setting user details when prevUserDetails is null', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        const partialUserDetails = {
            username: 'newuser',
            is_admin: true,
        };

        await act(async () => {
            await result.current.setAuthData(partialUserDetails);
        });

        expect(result.current.userDetails).toEqual({
            user_id: '',
            username: 'newuser',
            is_admin: true,
            is_oauth_account: false,
            spotify_subscription: null,
        });
    });
});