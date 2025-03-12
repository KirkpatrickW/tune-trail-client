import { useFocusEffect } from '@react-navigation/native';
import React, { createContext, useCallback, useContext, useState } from 'react';

type UserSidebarContextType = {
    toggleUserSidebar: () => void;
    isUserSidebarVisible: boolean;
    setIsUserSidebarVisible: (value: boolean) => void;
};

const UserSidebarContext = createContext<UserSidebarContextType>({} as UserSidebarContextType);

export const UserSidebarProvider = ({ children }: { children: React.ReactNode }) => {
    const [isUserSidebarVisible, setIsUserSidebarVisible] = useState(false);

    const toggleUserSidebar = () => setIsUserSidebarVisible(!isUserSidebarVisible);

    useFocusEffect(
        useCallback(() => {
            return () => {
                setIsUserSidebarVisible(false);
            };
        }, [])
    );

    return (
        <UserSidebarContext.Provider value={{
            toggleUserSidebar,
            isUserSidebarVisible,
            setIsUserSidebarVisible
        }}>
            {children}
        </UserSidebarContext.Provider>
    );
};

export const useUserSidebar = () => {
    const context = useContext(UserSidebarContext);
    if (!context) {
        throw new Error('useUserSidebar must be used within a UserSidebarProvider');
    }
    return context;
};