import { CompleteSpotifyModal } from '@/components/auth/CompleteSpotifyModal';
import SessionUnavailableModal from '@/components/auth/SessionUnavailableModal';
import { UserDetails } from '@/types/auth/userDetails';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextType {
    accessToken: string | null;
    userDetails: UserDetails | null;
    isAdmin: boolean;
    isSessionUnavailable: boolean;
    isAuthLoaded: boolean;
    isAuthenticated: boolean;
    isCompleteSpotifyModalVisible: boolean;
    setAuthData: (userDetails: Partial<UserDetails>, accessToken?: string) => Promise<void>;
    clearAuthData: () => Promise<void>;
    showSessionUnavailableModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [userDetails, setUserDetailsState] = useState<UserDetails | null>(null);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);
    const [isSessionUnavailable, setIsSessionUnavailable] = useState(false);
    const [isCompleteSpotifyModalVisible, setIsCompleteSpotifyModalVisible] = useState(false);

    const isAuthenticated = !!accessToken;
    const isAdmin = useMemo(() => userDetails?.is_admin ?? false, [userDetails]);

    useEffect(() => {
        const loadAuthData = async () => {
            const accessToken = await SecureStore.getItemAsync('access_token');
            const storedUserDetails = await SecureStore.getItemAsync('user_details');
            if (accessToken && storedUserDetails) {
                setAccessTokenState(accessToken);
                setUserDetailsState(JSON.parse(storedUserDetails));
            }
            setIsAuthLoaded(true);
        };
        loadAuthData();
    }, []);

    useEffect(() => {
        if (userDetails?.is_oauth_account === true && userDetails?.username === null) {
            setIsCompleteSpotifyModalVisible(true);
        } else {
            setIsCompleteSpotifyModalVisible(false);
        }
    }, [userDetails]);

    const setAuthData = async (userDetails: Partial<UserDetails>, accessToken?: string) => {
        if (accessToken) {
            await SecureStore.setItemAsync('access_token', accessToken);
            setAccessTokenState(accessToken);
        }

        setUserDetailsState((prevUserDetails) => {
            const updatedUserDetails: UserDetails = {
                user_id: userDetails.user_id !== undefined ? userDetails.user_id : prevUserDetails?.user_id ?? '',
                username: userDetails.username !== undefined ? userDetails.username : prevUserDetails?.username ?? null,
                is_admin: userDetails.is_admin !== undefined ? userDetails.is_admin : prevUserDetails?.is_admin ?? false,
                is_oauth_account: userDetails.is_oauth_account !== undefined ? userDetails.is_oauth_account : prevUserDetails?.is_oauth_account ?? false,
                spotify_subscription: userDetails.spotify_subscription !== undefined ? userDetails.spotify_subscription : prevUserDetails?.spotify_subscription ?? null,
            };

            SecureStore.setItemAsync('user_details', JSON.stringify(updatedUserDetails));

            return updatedUserDetails;
        });
    };

    const clearAuthData = async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('user_details');
        setAccessTokenState(null);
        setUserDetailsState(null);
    };

    const showSessionUnavailableModal = () => {
        setIsSessionUnavailable(true);
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                userDetails,
                isAdmin,
                isSessionUnavailable,
                isAuthLoaded,
                isAuthenticated,
                isCompleteSpotifyModalVisible,
                setAuthData,
                clearAuthData,
                showSessionUnavailableModal
            }}>
            {children}
            <SessionUnavailableModal isVisible={isSessionUnavailable} onClose={() => setIsSessionUnavailable(false)} />
            <CompleteSpotifyModal isVisible={isCompleteSpotifyModalVisible} onClose={() => setIsCompleteSpotifyModalVisible(false)} setAuthData={setAuthData} />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};