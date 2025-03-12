import { Maps } from '@/components/maps/Maps';
import { useUserSidebar } from '@/context/UserSidebarContext';
import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const IndexScreen = () => {
	const { toggleUserSidebar } = useUserSidebar();
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.indexContainer}>
			<Maps />
			<View style={[styles.toolbar, { top: insets.top }]}>
				{/* Left Group: User Button and Search Button */}
				<View style={styles.leftGroup}>
					<TouchableOpacity
						onPress={toggleUserSidebar}
						style={styles.toolbarButton}
						activeOpacity={0.9}>
						<FontAwesome6 name="user" size={20} color="white" />
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => console.log('Search button pressed')}
						style={styles.toolbarButton}
						activeOpacity={0.9}>
						<FontAwesome6 name="magnifying-glass" size={20} color="white" />
					</TouchableOpacity>
				</View>

				{/* Location Container - Centered */}
				<View style={styles.locationContainer}>
					<Text style={styles.locationText}>BALLYCLARE</Text>
				</View>

				{/* Right Group: Spacer and Settings Button */}
				<View style={styles.rightGroup}>
					<View style={styles.rightSpacer} />
					<TouchableOpacity
						onPress={() => console.log('Settings button pressed')}
						style={styles.toolbarButton}
						activeOpacity={0.9}>
						<FontAwesome6 name="gear" size={20} color="white" />
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	indexContainer: {
		flex: 1,
		backgroundColor: 'black',
	},
	toolbar: {
		position: 'absolute',
		left: 20,
		right: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	leftGroup: {
		flexDirection: 'row',
		gap: 10,
	},
	toolbarButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#171717',
		justifyContent: 'center',
		alignItems: 'center',
	},
	locationContainer: {
		flex: 1, // Takes up remaining space
		height: 40,
		backgroundColor: '#171717',
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		marginHorizontal: 10, // Adds spacing between left group and right group
	},
	locationText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	rightGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10, // Adds spacing between spacer and gear button
	},
	rightSpacer: {
		width: 40, // Matches the width of the gear button
	},
});

export default IndexScreen;