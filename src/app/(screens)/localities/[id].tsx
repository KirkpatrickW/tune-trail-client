import { localitiesService } from '@/api/localitiesService';
import { localityTracksService } from '@/api/localityTracksService';
import { MovingText } from '@/components/MovingText';
import { SearchTracksModal } from "@/components/tracks/SearchTracksModal";
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
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
	const { isAuthenticated } = useAuth();
	const { currentLocality, currentTrack } = usePlayer();

	const [isSearchTracksModalVisible, setIsSearchTracksModalVisible] = useState(false);
	const [tracks, setTracks] = useState<LocalityTrack[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [votingState, setVotingState] = useState<{ localityTrackId: number | null; voteType: 1 | -1 | null }>({
		localityTrackId: null,
		voteType: null,
	});

	const existingSpotifyTrackIds = useMemo(() => tracks.map((track) => track.spotify_id), [tracks]);

	useEffect(() => { fetchTracks(); }, [id]);

	const fetchTracks = async () => {
		setIsLoading(true);
		setTracks([]);

		try {
			const response = await localitiesService.getTracksInLocality(id as string);
			setTracks(response.data);
		} catch (error) { }

		setIsLoading(false);
	};

	const handleVote = async (localityTrackId: number, buttonVote: 1 | -1) => {
		const track = tracks.find((t) => t.locality_track_id === localityTrackId);
		if (!track) return;

		setVotingState({ localityTrackId, voteType: buttonVote });

		const existingUserVote = track.user_vote;
		const userVote = existingUserVote === buttonVote ? 0 : buttonVote;

		try {
			await localityTracksService.voteOnLocalityTrack(localityTrackId, userVote);

			const voteChange = userVote - existingUserVote;

			const updatedTrack = {
				...track,
				total_votes: track.total_votes + voteChange,
				user_vote: userVote,
			};

			setTracks((prevTracks) =>
				prevTracks
					.map((t) =>
						t.locality_track_id === localityTrackId ? updatedTrack : t
					)
					.sort((a, b) => b.total_votes - a.total_votes)
			);
		} catch (error) { }

		setVotingState({ localityTrackId: null, voteType: null });
	};

	const formatVoteCount = (totalVotes: number) => {
		return totalVotes > 999 ? "999+" : totalVotes.toString();
	};

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
						renderItem={({ item, index }) => {
							const isCurrentTrack = currentLocality?.locality_id == id && currentTrack?.track_id == item.track_id;

							return (
								<View style={styles.trackItem}>
									<Text style={[styles.trackIndex, isCurrentTrack && { color: '#6b2367' }]}>{index + 1}</Text>
									<View style={styles.trackContent}>
										<FastImage
											source={{ uri: item.cover.small || item.cover.medium || item.cover.large }}
											style={styles.trackImage}
										/>
										<View style={styles.trackInfo}>
											<Text style={[styles.trackTitle, isCurrentTrack && { color: '#6b2367' }]} numberOfLines={1}>
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
									<View style={styles.votingContainer}>
										{isAuthenticated && (
											<>
												{votingState.localityTrackId === item.locality_track_id && votingState.voteType === 1 ? (
													<ActivityIndicator size="small" color="white" />
												) : (
													<TouchableOpacity
														onPress={() => handleVote(item.locality_track_id, 1)}
														disabled={votingState.localityTrackId !== null}
													>
														<FontAwesome name="arrow-up" size={20} color={item.user_vote === 1 ? "#6b2367" : "white"} />
													</TouchableOpacity>
												)}
											</>
										)}
										<Text style={styles.voteCount}>{formatVoteCount(item.total_votes)}</Text>
										{isAuthenticated && (
											<>
												{votingState.localityTrackId === item.locality_track_id && votingState.voteType === -1 ? (
													<ActivityIndicator size="small" color="white" />
												) : (
													<TouchableOpacity
														onPress={() => handleVote(item.locality_track_id, -1)}
														disabled={votingState.localityTrackId !== null}
													>
														<FontAwesome name="arrow-down" size={20} color={item.user_vote === -1 ? "#6b2367" : "white"} />
													</TouchableOpacity>
												)}
											</>
										)}
									</View>
								</View>
							)
						}}
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
		maxWidth: '100%',
		overflow: 'hidden',
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
	},
	trackIndex: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
		width: 30,
		marginRight: 10,
	},
	trackContent: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
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
	votingContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		marginLeft: 10,
		paddingHorizontal: 12,
		width: 60,
	},
	voteCount: {
		color: '#fff',
		marginVertical: 4,
		fontSize: 16,
		textAlign: 'center',
	},
});

export default LocalityScreen;