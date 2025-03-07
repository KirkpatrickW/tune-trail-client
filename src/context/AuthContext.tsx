import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    accessToken: string | null;
    isSessionUnavailable: boolean;
    isAuthLoaded: boolean;
    isAuthenticated: boolean;
    setAccessToken: (token: string) => Promise<void>;
    clearAccessToken: () => Promise<void>;
    showSessionUnavailableModal: () => void;
    hideSessionUnavailableModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [isSessionUnavailable, setIsSessionUnavailable] = useState(false);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);
    const isAuthenticated = !!accessToken;

    useEffect(() => {
        const loadAuthData = async () => {
            const token = await SecureStore.getItemAsync('access_token');
            const userData = await SecureStore.getItemAsync('user');
            if (token && userData) {
                setAccessTokenState(token);
            }
            setIsAuthLoaded(true);
        };
        loadAuthData();
    }, []);

    const setAccessToken = async (token: string) => {
        await SecureStore.setItemAsync('access_token', token);
        setAccessTokenState(token);
    };

    const clearAccessToken = async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('user');
        setAccessTokenState(null);
    };

    const showSessionUnavailableModal = () => {
        setIsSessionUnavailable(true);
    };

    const hideSessionUnavailableModal = () => {
        setIsSessionUnavailable(false);
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                isSessionUnavailable,
                isAuthLoaded,
                isAuthenticated,
                setAccessToken,
                clearAccessToken,
                showSessionUnavailableModal,
                hideSessionUnavailableModal,
            }}>
            {children}
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