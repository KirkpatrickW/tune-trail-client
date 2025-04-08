import { FloatingPlayer } from "@/components/player/FloatingPlayer";
import { UserSidebarProvider } from "@/context/UserSidebarContext";
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
                <Stack.Screen
                    name="admin/manage-users"
                    options={{
                        animation: "fade",
                        animationDuration: 400,
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="admin/manage-tracks"
                    options={{
                        animation: "fade",
                        animationDuration: 400,
                        headerShown: false,
                    }}
                />
            </Stack>

            <FloatingPlayer />
        </>
    );
};

export default ScreensNavigation;