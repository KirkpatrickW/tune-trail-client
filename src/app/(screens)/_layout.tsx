import { FloatingPlayer } from "@/components/player/FloatingPlayer";
import { UserSidebar } from "@/components/user/UserSidebar";
import { UserSidebarProvider, useUserSidebar } from "@/context/UserSidebarContext";
import { Stack } from "expo-router";
import React from "react";

const ScreensNavigation = () => {
    return (
        <UserSidebarProvider>
            <ScreenContent />
        </UserSidebarProvider>
    );
};

const ScreenContent = () => {
    const { isUserSidebarVisible, setIsUserSidebarVisible } = useUserSidebar();

    return (
        <>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen
                    name="localities/[id]"
                    options={{
                        animation: "fade",
                        animationDuration: 400,
                        headerShown: false,
                    }}
                />
            </Stack>

            <FloatingPlayer />
            <UserSidebar
                isVisible={isUserSidebarVisible}
                onClose={() => setIsUserSidebarVisible(false)}
            />
        </>
    );
};

export default ScreensNavigation;