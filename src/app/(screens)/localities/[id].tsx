import { localitiesService } from '@/api/localitiesService';
import { MovingText } from '@/components/MovingText';
import { SearchTracksModal } from "@/components/tracks/SearchTracksModal";
import { useAuth } from '@/context/AuthContext';
import { LocalityTrack } from '@/types/LocalityTrack';
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LocalityScreen = () => {
	const { id, name } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const [isSearchTracksModalVisible, setIsSearchTracksModalVisible] = useState(false);
	const [tracks, setTracks] = useState<LocalityTrack[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const { isAuthenticated } = useAuth()

	const existingSpotifyTrackIds = useMemo(() => {
		return tracks.map((track) => track.spotify_id);
	}, [tracks]);

	const fetchTracks = async () => {
		setIsLoading(true);
		setTracks([]);

		try {
			const response = await localitiesService.getTracksInLocality(id as string);
			setTracks(response.data);
		} catch (error) { }

		setIsLoading(false);
	};

	useEffect(() => {
		fetchTracks();
	}, [id]);

	return (
		<>
			<View style={styles.container}>
				<View style={[styles.header, {
					paddingTop: insets.top,
					height: 80 + insets.top
				}]}>
					<View style={styles.leftHeader}>
						<TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
							<FontAwesome name="chevron-left" size={20} color="white" />
						</TouchableOpacity>
						<TouchableOpacity onPress={fetchTracks} style={styles.headerButton} disabled={isLoading}>
							<FontAwesome name="refresh" size={20} color="white" />
						</TouchableOpacity>
					</View>

					<View style={styles.centerHeader}>
						<MovingText
							text={String(name)}
							animationThreshold={10}
							style={styles.headerTitle}
						/>
					</View>

					<View style={styles.rightHeader}>
						{isAuthenticated &&
							<TouchableOpacity onPress={() => setIsSearchTracksModalVisible(true)} style={styles.headerButton} disabled={isLoading}>
								<FontAwesome name="plus" size={20} color="white" />
							</TouchableOpacity>
						}
					</View>
				</View>

				<View style={styles.flatListContentContainer}>
					<FlatList
						data={tracks}
						ListEmptyComponent={
							<View style={styles.flatListEmptyContainer}>
								{isLoading ? (
									<ActivityIndicator size="large" color="#fff" />
								) : (
									<View style={styles.flatListTextContainer}>
										<Text style={styles.flatListTitle}>This stage is all yours</Text>
										<Text style={styles.flatListSubtitle}>{name}'s playlist is currently powered by awkward silence - want to fix that?</Text>
									</View>
								)}
							</View>
						}
						keyExtractor={(item) => item.track_id}
						renderItem={({ item }) => (
							<View style={styles.trackItem}>
								<FastImage
									source={{ uri: item.cover.small || item.cover.medium || item.cover.large }}
									style={styles.trackImage}
								/>
								<View style={styles.trackInfo}>
									<Text style={styles.trackTitle} numberOfLines={1}>
										{item.name}
									</Text>
									<Text style={styles.trackArtist} numberOfLines={1}>
										{item.artists.join(", ")}
									</Text>
									<Text style={styles.trackContributor} numberOfLines={1}>
										Contribution by <Text style={styles.trackContributorUsername}>@{item.username}</Text>
									</Text>
								</View>
							</View>
						)}
						indicatorStyle="white"
						onEndReachedThreshold={0.5}
						contentContainerStyle={{ flexGrow: 1 }}
					/>
				</View>
			</View>
			<SearchTracksModal
				isVisible={isSearchTracksModalVisible}
				onClose={() => setIsSearchTracksModalVisible(false)}
				onTrackAdded={fetchTracks}
				localityDetails={{
					localityId: String(id),
					name: String(name),
					existingSpotifyTrackIds
				}} />
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#171717"
	},
	header: {
		backgroundColor: "#242424",
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		elevation: 10,
		position: 'relative',
		zIndex: 10,
	},
	leftHeader: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
	centerHeader: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		maxWidth: '100%', // Ensure the container width is constrained
		overflow: 'hidden', // Prevent the text from overflowing outside
	},
	rightHeader: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: 'white',
		textTransform: 'uppercase',
		textAlign: 'center',
	},
	headerButton: {
		padding: 10,
	},
	flatListContentContainer: {
		flex: 1,
		paddingHorizontal: 24,
	},
	flatListEmptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	flatListTextContainer: {
		justifyContent: "center",
		alignItems: "center",
	},
	flatListTitle: {
		fontSize: 24,
		color: "#fff",
		fontWeight: "bold",
	},
	flatListSubtitle: {
		fontSize: 16,
		color: "#fff",
		opacity: 0.6,
		textAlign: "center",
		maxWidth: 300,
	},
	trackItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#333",
		justifyContent: "space-between",
	},
	trackImage: {
		width: 50,
		height: 50,
		borderRadius: 5,
		marginRight: 10,
	},
	trackInfo: {
		flex: 1,
	},
	trackTitle: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	trackArtist: {
		fontSize: 14,
		color: "rgba(255,255,255,0.6)",
	},
	trackContributor: {
		fontSize: 12,
		marginTop: 2,
		color: "rgba(255,255,255,0.6)",
	},
	trackContributorUsername: {
		fontWeight: "bold",
		color: "#fff",
	},
});

export default LocalityScreen;
