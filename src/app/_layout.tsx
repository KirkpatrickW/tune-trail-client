import { useLogTrackPlayerState } from '@/hooks/player/useLogTrackPlayerState';
import { useSetupTrackPlayer } from '@/hooks/player/useSetupTrackPlayer';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const App = () => {
  const handleTrackPlayerLoaded = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);
  useSetupTrackPlayer({ onLoad: handleTrackPlayerLoaded });
  useLogTrackPlayerState();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootNavigation />
        
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const RootNavigation = () => {
  return (
    <Stack>
      <Stack.Screen name="(screens)" options={{ headerShown: false}}/>
      
      <Stack.Screen name="player" options={{
        presentation: "card",
        gestureEnabled: true,
        gestureDirection: "vertical",
        animation: "slide_from_bottom",
        animationDuration: 400,
        headerShown: false,
      }}/>
    </Stack>
  );
};

export default App;
