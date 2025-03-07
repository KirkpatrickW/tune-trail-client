import { CompleteSpotifyModal } from '@/components/auth/CompleteSpotifyModal';
import { Maps } from '@/components/maps/Maps';
import { useUserSidebar } from '@/context/UserSidebarContext';
import { FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const IndexScreen = () => {
	const { toggleUserSidebar } = useUserSidebar();
	const [showModal, setShowModal] = useState(false);

	return (
		<View style={styles.indexContainer}>
			<Maps />
			{/* Existing user button */}
			<TouchableOpacity
				onPress={toggleUserSidebar}
				style={styles.userButton}
			>
				<FontAwesome6 name="user" size={20} color="white" />
			</TouchableOpacity>

			{/* New temporary modal trigger button */}
			<TouchableOpacity
				onPress={() => setShowModal(true)}
				style={styles.modalTriggerButton}
			>
				<FontAwesome6 name="plus" size={20} color="white" />
			</TouchableOpacity>

			<CompleteSpotifyModal
				isVisible={showModal}
				onClose={() => setShowModal(false)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	indexContainer: {
		flex: 1,
		backgroundColor: "black"
	},
	userButton: {
		position: 'absolute',
		top: 40,
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1001,
	},
	modalTriggerButton: {
		position: 'absolute',
		top: 40,
		right: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#6b2367',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1001,
	},
});

export default IndexScreen;