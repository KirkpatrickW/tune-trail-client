import { FloatingPlayer } from "@/components/FloatingPlayer";
import { Stack } from "expo-router";
import React from "react";

const ScreensNavigation = () => {
    return (
        <>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
            </Stack>
        
            <FloatingPlayer />
        </>
    );

}

export default ScreensNavigation;