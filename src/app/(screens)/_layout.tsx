import { FloatingPlayer } from "@/components/player/FloatingPlayer";
import { Stack } from "expo-router";
import React from "react";

const ScreensNavigation = () => {
    return (
        <>
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="localities/[id]" options={{
                    animation: "fade",
                    animationDuration: 400,
                    headerShown: false,
                }} />
                <Stack.Screen name="tracks/search-tracks-modal" options={{
                    presentation: "transparentModal",
                    headerShown: false,
                    animation: "slide_from_bottom"
                }} />
            </Stack>

            <FloatingPlayer />
        </>
    );

}

export default ScreensNavigation;