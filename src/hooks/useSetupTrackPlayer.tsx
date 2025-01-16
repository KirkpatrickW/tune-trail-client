import { useEffect, useRef } from "react";
import TrackPlayer from "react-native-track-player";

const setupPlayer = async() => {
    await TrackPlayer.setupPlayer({
        maxCacheSize: 1024 * 10,
    });
}

export const useSetupTrackPlayer = ({onLoad}: {onLoad?: () => void}) => {
    const isInitialised = useRef(false);

    useEffect(() => {
        setupPlayer()
        .then(() => {
            isInitialised.current = true;
            onLoad?.();
        })
        .catch((error) => {
            isInitialised.current = false;
            console.error(error);
        });
    }, [onLoad]);
}