import { UserSidebar } from '@/components/user/UserSidebar';
import { useFocusEffect } from '@react-navigation/native';
import React, { createContext, useCallback, useContext, useState } from 'react';

type UserSidebarContextType = {
    toggleUserSidebar: () => void;
};

const UserSidebarContext = createContext<UserSidebarContextType | undefined>(undefined);

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
            toggleUserSidebar
        }}>
            {children}
            <UserSidebar isVisible={isUserSidebarVisible} onClose={() => setIsUserSidebarVisible(false)} />
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