import { MovingText } from "@/components/MovingText";
import { LocationControls } from "@/components/player/LocationControls";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PlayerProgressBar } from "@/components/player/PlayerProgressBar";
import { PlayerVolumeBar } from "@/components/player/PlayerVolumeBar";
import { defaultStyles } from "@/styles";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveTrack } from "react-native-track-player";

const PlayerScreen = () => {
    const activeTrack = useActiveTrack();

    const {top, bottom} = useSafeAreaInsets();

    if (!activeTrack) {
        return null
    }

    return (<View style={styles.overlayContainer}>
        <View style={styles.topBar}>
            <StatusBar style="light" />
            <DismissPlayerSymbol/>
            <LocationControls style={{ marginTop: top + 20 }} />
        </View>

        <View style={{flex: 1, marginTop: top + 120, marginBottom: bottom}}>
            <View style={styles.artworkImageContainer}>
                <Image source={{
                    uri: "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Dare-cover.png/220px-Dare-cover.png",
                }} resizeMode="cover" style={styles.artworkImage}/>
            </View>

            <View style={{flex: 1}}>
                <View style={{marginTop: "auto"}}>
                    <View style={{ height: 60 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>

                            <View style={styles.trackTitleContainer}>
                                <MovingText
                                    text={activeTrack.title ?? ''}
                                    animationThreshold={30}
                                    style={styles.trackTitleText}
                                />
                            </View>
                        </View>

                        {activeTrack.artist && (
                            <Text numberOfLines={1} style={[styles.trackArtistText, { marginTop: 6 }]}>
                                {activeTrack.artist}
                            </Text>
                        )}
                    </View>

                    <PlayerProgressBar style={{ marginTop: 32}} />

                    <PlayerControls style={{ marginTop: 40}} />
                </View>

                <PlayerVolumeBar style={{ marginTop: 'auto', marginBottom: 30 }}/>
            </View>
        </View>
    </View>);
}

const DismissPlayerSymbol = () => {
    const {top} = useSafeAreaInsets();

    return (<View style={{
        position: "absolute",
        top: top + 8,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center"
    }}>
        <View accessible={false} style={{
            width: 50,
            height: 8,
            borderRadius: 8,
            backgroundColor: "white",
            opacity: 0.7
        }}/>
    </View>)
}

const styles = StyleSheet.create({
    overlayContainer: {
        ...defaultStyles.container,
        paddingHorizontal: 24,
        backgroundColor: "#6b2367"
    },
    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#171717",
        elevation: 10,
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    artworkImageContainer: {
        elevation: 10,
        backgroundColor: 'white',
        flexDirection: 'row',
        justifyContent: 'center',
        height: '45%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    artworkImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    trackTitleContainer: {
		flex: 1,
		overflow: 'hidden',
	},
	trackTitleText: {
        color: '#fff',
		fontSize: 22,
		fontWeight: '700',
	},
    trackArtistText: {
		color: '#fff',
		fontSize: 20,
		opacity: 0.8,
		maxWidth: '90%',
	},
});

export default PlayerScreen;