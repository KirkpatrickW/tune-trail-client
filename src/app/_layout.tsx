import { configureApiClient } from '@/api/apiClient';
import toastConfig from '@/config/toastConfig';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const App = () => {
	const insets = useSafeAreaInsets();

	return (
		<SafeAreaProvider>
			<LocationProvider>
				<AuthProvider>
					<PlayerProvider>
						<GestureHandlerRootView style={{ flex: 1 }}>
							<AppInitialiser />
							<RootNavigation />
							<StatusBar style="light" />
							<Toast config={toastConfig} topOffset={insets.top + 20} />
						</GestureHandlerRootView>
					</PlayerProvider>
				</AuthProvider>
			</LocationProvider>
		</SafeAreaProvider>
	);
};

const AppInitialiser = () => {
	const {
		setAuthData,
		clearAuthData,
		showSessionUnavailableModal,
		isAuthLoaded,
		isAuthenticated
	} = useAuth();
	const router = useRouter();

	// apiClient Setup
	useEffect(() => {
		configureApiClient({ setAuthData, clearAuthData, showSessionUnavailableModal });
	}, [setAuthData, clearAuthData, showSessionUnavailableModal]);

	// Redirect to AuthScreen onload if the user is not authenticated.
	useEffect(() => {
		if (!isAuthLoaded) return;

		if (!isAuthenticated) {
			router.replace('/auth');
		}
	}, [isAuthLoaded])

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

export default App;