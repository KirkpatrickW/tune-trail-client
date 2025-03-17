import type { LocalityMapViewHandle } from "@/components/maps/LocalityMapView";
import { LocalityMapView } from "@/components/maps/LocalityMapView";
import { useUserSidebar } from "@/context/UserSidebarContext";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IndexScreen = () => {
	const { toggleUserSidebar } = useUserSidebar();
	const insets = useSafeAreaInsets();
	const localityMapViewRef = useRef<LocalityMapViewHandle>(null);
	const [isMapLocked, setIsMapLocked] = useState(true);
	const [isFetchingGrids, setIsFetchingGrids] = useState(false);

	const handleRecenter = () => {
		localityMapViewRef.current?.recenterMap();
	};

	return (
		<View style={styles.indexContainer}>
			<LocalityMapView ref={localityMapViewRef} onLockStatusChange={setIsMapLocked} onFetchingGridsChange={setIsFetchingGrids} />
			{/* Toolbar with two rows */}
			<View style={[styles.toolbarContainer, { top: insets.top }]}>
				{/* First Row: Existing Toolbar */}
				<View style={styles.toolbarRow}>
					{/* Left Group: User Button and Search Button */}
					<View style={styles.leftGroup}>
						<TouchableOpacity
							onPress={toggleUserSidebar}
							style={styles.toolbarButton}
							activeOpacity={0.9}>
							<FontAwesome6 name="user" size={20} color="white" />
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => console.log("Search button pressed")}
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
							onPress={() => console.log("Settings button pressed")}
							style={styles.toolbarButton}
							activeOpacity={0.9}>
							<FontAwesome6 name="gear" size={20} color="white" />
						</TouchableOpacity>
					</View>
				</View>

				{/* Second Row: Recenter Button */}
				<View style={styles.toolbarMapTray}>
					{!isMapLocked && (
						<TouchableOpacity
							onPress={handleRecenter}
							style={styles.toolbarMapTrayIndicator}
							activeOpacity={0.9}>
							<FontAwesome6 name="location-crosshairs" size={20} color="white" />
						</TouchableOpacity>
					)}

					{isFetchingGrids && (
						<View style={styles.toolbarMapTrayIndicator}>
							<ActivityIndicator size="small" color="white" />
						</View>
					)}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	indexContainer: {
		flex: 1,
		backgroundColor: "black",
	},
	toolbarContainer: {
		position: "absolute",
		left: 20,
		right: 20,
	},
	toolbarRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	leftGroup: {
		flexDirection: "row",
		gap: 10,
	},
	locationContainer: {
		flex: 1,
		height: 40,
		backgroundColor: "#171717",
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: 10,
	},
	locationText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	rightGroup: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	toolbarButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#171717",
		justifyContent: "center",
		alignItems: "center",
	},
	rightSpacer: {
		width: 40,
	},
	toolbarMapTray: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 10, // Space between the first row and the recenter button
	},
	toolbarMapTrayIndicator: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#171717",
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: 10,
	},
});

export default IndexScreen;