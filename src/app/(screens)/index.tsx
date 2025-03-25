import { MovingText } from "@/components/MovingText";
import type { LocalityMapViewHandle } from "@/components/maps/LocalityMapView";
import { LocalityMapView } from "@/components/maps/LocalityMapView";
import RadiusSlider from "@/components/maps/RadiusSlider";
import { useUserSidebar } from "@/context/UserSidebarContext";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IndexScreen = () => {
	const { toggleUserSidebar } = useUserSidebar();
	const insets = useSafeAreaInsets();
	const localityMapViewRef = useRef<LocalityMapViewHandle>(null);

	const [isMapLocked, setIsMapLocked] = useState(true);
	const [isFetchingGrids, setIsFetchingGrids] = useState(false);
	const [areaName, setAreaName] = useState("Earth");

	const handleRecenter = () => {
		localityMapViewRef.current?.recenterMap();
	};

	return (
		<View style={styles.indexContainer}>
			<LocalityMapView
				ref={localityMapViewRef}
				onLockStatusChange={setIsMapLocked}
				onFetchingGridsChange={setIsFetchingGrids}
				onAreaNameChange={setAreaName}
			/>
			<View style={[styles.toolbarContainer, { top: insets.top }]}>
				<View style={styles.toolbarRow}>
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

					<View style={styles.locationContainer}>
						<View style={styles.movingTextContainer}>
							<MovingText
								text={areaName}
								animationThreshold={10}
								style={styles.locationText}
							/>
						</View>
					</View>

					<View style={styles.rightGroup}>
						<View style={styles.rightSpacer} />
						<RadiusSlider />
					</View>
				</View>

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
		paddingHorizontal: 20,
		flexDirection: "row",
	},
	movingTextContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
	},
	locationText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
		textTransform: "uppercase",
		textAlign: "center"
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
		marginTop: 10,
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