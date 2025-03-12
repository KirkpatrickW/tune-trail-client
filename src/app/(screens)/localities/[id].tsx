import { localitiesService } from '@/api/localitiesService';
import { SearchTracksModal } from "@/components/tracks/SearchTracksModal";
import { LocalityTrack } from '@/types/LocalityTrack';
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LocalityScreen = () => {
	const { id, name } = useLocalSearchParams();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const [isModalVisible, setIsModalVisible] = useState(false);
	const [tracks, setTracks] = useState<LocalityTrack[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const fetchTracks = async () => {
		try {
			const response = await localitiesService.getTracksInLocality(id as string);
			setTracks(response.data);
		} catch (error) {
			console.error('Error fetching tracks:', error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	const handleRefresh = () => {
		setIsRefreshing(true);
		fetchTracks();
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
					<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
						<FontAwesome name="chevron-left" size={20} color="white" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>{name}</Text>
					<TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.backButton}>
						<FontAwesome name="plus" size={20} color="white" />
					</TouchableOpacity>
				</View>

				<View style={styles.flatListContentContainer}>
					<FlatList
						data={tracks}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={handleRefresh}
								tintColor="#fff"
								titleColor="#fff"
								progressBackgroundColor="#242424"
							/>
						}
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
				isVisible={isModalVisible}
				onClose={() => setIsModalVisible(false)}
				localityDetails={{
					localityId: String(id),
					name: String(name)
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
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		elevation: 10,
		position: 'relative',
		zIndex: 10,
	},
	backButton: {
		padding: 10,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: 'white',
		textTransform: 'uppercase',
		textAlign: 'center',
		flex: 1,
	},
	addButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'white',
		justifyContent: 'center',
		alignItems: 'center',
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
		borderBottomColor: "#7e2979",
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
		color: "#fff",
		opacity: 0.6,
		fontSize: 14,
	},
});

export default LocalityScreen;
