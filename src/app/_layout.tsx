import { configureApiClient } from '@/api/apiClient';
import SessionUnavailableModal from '@/components/auth/SessionUnavailableModal';
import toastConfig from '@/config/toastConfig';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useLogTrackPlayerState } from '@/hooks/player/useLogTrackPlayerState';
import { useSetupTrackPlayer } from '@/hooks/player/useSetupTrackPlayer';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const App = () => {
	const insets = useSafeAreaInsets();

	return (
		<SafeAreaProvider>
			<AuthProvider>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<AppInitialiser />
					<RootNavigation />
					<SessionUnavailableModalWrapper />
					<StatusBar style="light" />
					<Toast config={toastConfig} topOffset={insets.top + 20} />
				</GestureHandlerRootView>
			</AuthProvider>
		</SafeAreaProvider>
	);
};

const AppInitialiser = () => {
	const {
		setAccessToken,
		clearAccessToken,
		showSessionUnavailableModal,
		isAuthLoaded,
		isAuthenticated
	} = useAuth();
	const router = useRouter();

	// apiClient Setup
	useEffect(() => {
		configureApiClient({ setAccessToken, clearAccessToken, showSessionUnavailableModal });
	}, [setAccessToken, clearAccessToken, showSessionUnavailableModal]);

	// Redirect to AuthScreen onload if the user is not authenticated.
	useEffect(() => {
		if (!isAuthLoaded) return;

		if (!isAuthenticated) {
			router.replace('/auth');
		}
	}, [isAuthLoaded])


	// (LEGACY) TrackPlayer Setup
	const handleTrackPlayerLoaded = useCallback(() => { }, []);
	useSetupTrackPlayer({ onLoad: handleTrackPlayerLoaded });
	useLogTrackPlayerState();

	return null;
};

const RootNavigation = () => {
	return (
		<Stack>
			<Stack.Screen
				name="(screens)"
				options={{
					animation: 'fade',
					animationDuration: 500,
					headerShown: false,
				}} />
			<Stack.Screen
				name="auth"
				options={{
					animation: 'fade',
					animationDuration: 500,
					headerShown: false,
				}} />
			<Stack.Screen
				name="player"
				options={{
					presentation: 'card',
					gestureEnabled: true,
					gestureDirection: 'vertical',
					animation: 'slide_from_bottom',
					animationDuration: 400,
					headerShown: false,
				}} />
		</Stack>
	);
};

const SessionUnavailableModalWrapper = () => {
	const { isSessionUnavailable, hideSessionUnavailableModal } = useAuth();
	return <SessionUnavailableModal visible={isSessionUnavailable} onClose={hideSessionUnavailableModal} />;
};

export default App;