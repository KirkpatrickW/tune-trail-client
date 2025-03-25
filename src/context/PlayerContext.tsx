import { localityService } from '@/api/localityService';
import { useLocation } from '@/context/LocationContext';
import { PlayerLocality } from '@/types/player/playerLocality';
import { PlayerTrack } from '@/types/player/playerTrack';
import { LocationObject } from 'expo-location';
import { usePathname } from 'expo-router';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import Toast from 'react-native-toast-message';
import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Event,
    RepeatMode,
    Track,
    useIsPlaying,
    useProgress,
    useTrackPlayerEvents
} from 'react-native-track-player';

type PlayerContextType = {
    currentLocality: PlayerLocality | null;
    currentTrack: PlayerTrack | null;
    isPlaying: boolean | undefined;
    isSessionActive: boolean;
    playbackPosition: number;
    trackDuration: number;
    volume: number;
    radius: number;
    toggleSession: () => Promise<void>;
    pause: () => void;
    resume: () => void;
    setVolume: (value: number) => Promise<void>;
    setRadius: (value: number) => void;
    skipToNextTrack: () => void;
    skipToPreviousTrack: () => void;
    skipToNextLocality: () => void;
    skipToPreviousLocality: () => void;
    seekToPosition: (seconds: number) => Promise<void>;
    canSkipTrack: boolean;
    canSkipLocality: boolean;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const distanceMoved = (loc1: LocationObject, loc2: LocationObject) => {
    const dx = loc1.coords.latitude - loc2.coords.latitude;
    const dy = loc1.coords.longitude - loc2.coords.longitude;
    return Math.sqrt(dx * dx + dy * dy);
};

const createQueue = (localities: PlayerLocality[]): Track[] =>
    localities.flatMap((locality) =>
        locality.tracks.map((track): Track => ({
            id: `${locality.locality_id}:${track.track_id}`,
            url: track.preview_url,
            name: track.name,
            artist: track.artists.join(", "),
            artwork: track.cover.large,
        }))
    );

const calculateTrackFlatIndex = (localityIndex: number, trackIndex: number, allLocalities: PlayerLocality[]): number => {
    let index = 0;
    for (let i = 0; i < localityIndex; i++) {
        index += allLocalities[i].tracks.length;
    }
    return index + trackIndex;
};

const tryRestorePlaybackPosition = (newLocalities: PlayerLocality[], currentTrackId: string | undefined): [number, number, boolean] => {
    if (!currentTrackId) return [0, 0, false];

    for (let locIndex = 0; locIndex < newLocalities.length; locIndex++) {
        const trackIndex = newLocalities[locIndex].tracks.findIndex(
            (track) => track.track_id === currentTrackId
        );
        if (trackIndex !== -1) return [locIndex, trackIndex, true];
    }

    return [0, 0, false];
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const { userLocation } = useLocation();
    const { duration: trackDuration, position: playbackPosition } = useProgress(250);
    const { playing: isPlaying } = useIsPlaying();

    const [localities, setLocalities] = useState<PlayerLocality[]>([]);
    const [currentLocalityIndex, setCurrentLocalityIndex] = useState<number>(0);
    const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
    const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
    const [volume, setVolumeState] = useState<number>(1.0);
    const [radius, setRadius] = useState<number>(5000);

    const lastLocationRef = useRef<LocationObject | null>(null);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionIdRef = useRef<number>(0);

    const currentLocality = localities[currentLocalityIndex] ?? null;
    const currentTrack = currentLocality?.tracks[currentTrackIndex] ?? null;

    const allTracksCount = localities.reduce((acc, loc) => acc + loc.tracks.length, 0);
    const canSkipTrack = allTracksCount > 1;
    const canSkipLocality = localities.length > 1;

    const clearTimers = () => {
        if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };

    const endSession = useCallback(async () => {
        console.log('[Player] Ending session');
        clearTimers();
        await TrackPlayer.reset();
        setIsSessionActive(false);
        setLocalities([]);
        setCurrentLocalityIndex(0);
        setCurrentTrackIndex(0);
    }, []);

    const loadTracks = useCallback(async (location: LocationObject, sessionId: number): Promise<boolean> => {
        try {
            const { latitude, longitude } = location.coords;
            lastLocationRef.current = location;

            const response = await localityService.getTracksForLocalities(latitude, longitude, radius);
            const newLocalities = response.data;

            if (sessionId !== sessionIdRef.current) {
                console.warn("[Player] loadTracks aborted — stale session");
                return false;
            }

            if (!newLocalities.length && currentTrack && currentLocality) {
                console.warn('[Player] No localities — inserting ghost locality');

                const ghostLocality: PlayerLocality = {
                    ...currentLocality,
                    locality_id: `ghost-${currentLocality.locality_id}`,
                    tracks: [currentTrack],
                };

                const queue = await TrackPlayer.getQueue();

                const compositeId = `${currentLocality?.locality_id}:${currentTrack.track_id}`;
                const currentIndex = queue.findIndex(track => track.id === compositeId);

                if (currentIndex === -1) {
                    console.warn("[Player] Current track not found in queue — skipping ghost logic");
                    return false;
                }

                for (let i = queue.length - 1; i >= 0; i--) {
                    if (i !== currentIndex) {
                        await TrackPlayer.remove(i);
                    }
                }

                setLocalities([ghostLocality]);
                setCurrentLocalityIndex(0);
                setCurrentTrackIndex(0);

                return true;
            }

            const [newLocIndex, newTrackIndex, found] = tryRestorePlaybackPosition(
                newLocalities,
                currentTrack?.track_id
            );

            if (currentTrack && found) {
                console.log('[Player] Track found — syncing surrounding tracks only');

                const newQueue = createQueue(newLocalities);
                const currentFlatIndex = calculateTrackFlatIndex(newLocIndex, newTrackIndex, newLocalities);

                const before = newQueue.slice(0, currentFlatIndex);
                const after = newQueue.slice(currentFlatIndex + 1);

                const queue = await TrackPlayer.getQueue();

                const compositeId = `${currentLocality?.locality_id}:${currentTrack.track_id}`;
                const index = queue.findIndex(q => q.id === compositeId);

                if (index !== -1) {
                    for (let i = index - 1; i >= 0; i--) {
                        await TrackPlayer.remove(i);
                    }
                    for (let i = index + 1; i < queue.length; i++) {
                        await TrackPlayer.remove(index + 1);
                    }

                    if (before.length) {
                        await TrackPlayer.add(before, 0);
                    }
                    if (after.length) {
                        await TrackPlayer.add(after);
                    }

                    setLocalities(newLocalities);
                    setCurrentLocalityIndex(newLocIndex);
                    setCurrentTrackIndex(newTrackIndex);
                    return true;
                }
            }

            if (currentTrack && currentLocality) {
                console.warn('[Player] Track not found — using ghost locality');

                const ghostLocality: PlayerLocality = {
                    ...currentLocality,
                    locality_id: `ghost-${currentLocality.locality_id}`,
                    tracks: [currentTrack],
                };

                const queue = await TrackPlayer.getQueue();

                const compositeId = `${currentLocality?.locality_id}:${currentTrack.track_id}`;
                const index = queue.findIndex(q => q.id === compositeId);

                for (let i = queue.length - 1; i >= 0; i--) {
                    if (i !== index) {
                        await TrackPlayer.remove(i);
                    }
                }

                const newQueue = createQueue(newLocalities);
                await TrackPlayer.add(newQueue);

                setLocalities([ghostLocality, ...newLocalities]);
                setCurrentLocalityIndex(0);
                setCurrentTrackIndex(0);
                return true;
            }

            if (newLocalities.length > 0) {
                console.log('[Player] No current track — starting from beginning');

                const newQueue = createQueue(newLocalities);
                await TrackPlayer.reset();
                await TrackPlayer.add(newQueue);
                await TrackPlayer.setRepeatMode(RepeatMode.Queue);
                await TrackPlayer.setVolume(volume);
                await TrackPlayer.play();

                setLocalities(newLocalities);
                setCurrentLocalityIndex(0);
                setCurrentTrackIndex(0);
                return true;
            }

            return false;
        } catch (err) {
            console.error('[Player] Failed to load tracks:', err);
            await endSession();
            return false;
        }
    }, [volume, currentTrack, currentLocality, radius]);

    const startSession = useCallback(async () => {
        if (!isSessionActive && userLocation) {
            sessionIdRef.current += 1;

            console.log('[Player] Starting session');
            const success = await loadTracks(userLocation, sessionIdRef.current);
            if (!success) {
                console.warn('[Player] Session not started due to track load failure');
                Toast.show({
                    type: 'error',
                    text1: 'Failed to start listening session',
                    text2: 'No localities with tracks nearby.'
                });
                return;
            }

            setIsSessionActive(true);

            refreshTimerRef.current = setInterval(() => {
                if (
                    lastLocationRef.current &&
                    userLocation &&
                    distanceMoved(userLocation, lastLocationRef.current) > 0.002
                ) {
                    console.log('[Player] Movement detected. Refreshing tracks...');
                    Toast.show({
                        type: 'info',
                        text1: 'Location changed',
                        text2: 'Refreshing tracks based on new location.'
                    });
                    (async () => {
                        const success = await loadTracks(userLocation, sessionIdRef.current);
                        if (!success) {
                            Toast.show({
                                type: 'error',
                                text1: 'Location refresh failed',
                                text2: 'Could not refresh tracks after location change.',
                            });
                        }
                    })();
                }
            }, 5 * 60 * 1000);
        }
    }, [isSessionActive, userLocation, loadTracks, radius]);

    const toggleSession = async () => {
        if (isSessionActive) {
            await endSession();
        } else {
            await startSession();
        }
    };

    const pause = () => {
        console.log('[Player] Paused');
        TrackPlayer.pause();
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => {
            console.log('[Player] Auto-ending session after pause timeout');
            Toast.show({
                type: 'info',
                text1: 'Auto-ending listening session',
                text2: 'Pause timeout reached.'
            });
            endSession();
        }, 5 * 60 * 1000);
    };

    const resume = () => {
        console.log('[Player] Resumed');
        TrackPlayer.play();
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };

    const seekToPosition = async (seconds: number) => {
        console.log(`[Player] Seeking to ${seconds} seconds`);
        await TrackPlayer.seekTo(seconds);
    };

    const setVolume = async (value: number) => {
        console.log(`[Player] Setting volume to ${value}`);
        setVolumeState(value);
        await TrackPlayer.setVolume(value);
    };

    const skipToNextTrack = async () => {
        console.log('[Player] Skip to next track');
        try {
            const locality = localities[currentLocalityIndex];
            if (!locality) return;

            if (currentTrackIndex < locality.tracks.length - 1) {
                const newIndex = currentTrackIndex + 1;
                const flatIndex = calculateTrackFlatIndex(currentLocalityIndex, newIndex, localities);
                await TrackPlayer.skip(flatIndex);
                setCurrentTrackIndex(newIndex);
            } else if (currentLocalityIndex < localities.length - 1) {
                skipToNextLocality();
            } else {
                await TrackPlayer.skip(0);
                setCurrentLocalityIndex(0);
                setCurrentTrackIndex(0);
            }
        } catch (err) {
            console.error('[Player] Failed to skip to next track:', err);
            Toast.show({
                type: 'error',
                text1: 'Playback error',
                text2: 'Could not skip to next track.'
            });
            await endSession();
        }
    };

    const skipToPreviousTrack = async () => {
        console.log('[Player] Skip to previous track');
        try {
            if (currentTrackIndex > 0) {
                const newIndex = currentTrackIndex - 1;
                const flatIndex = calculateTrackFlatIndex(currentLocalityIndex, newIndex, localities);
                await TrackPlayer.skip(flatIndex);
                setCurrentTrackIndex(newIndex);
            } else if (currentLocalityIndex > 0) {
                const newLocality = localities[currentLocalityIndex - 1];
                const lastTrackIndex = newLocality.tracks.length - 1;
                const flatIndex = calculateTrackFlatIndex(currentLocalityIndex - 1, lastTrackIndex, localities);
                await TrackPlayer.skip(flatIndex);
                setCurrentLocalityIndex(currentLocalityIndex - 1);
                setCurrentTrackIndex(lastTrackIndex);
            }
        } catch (err) {
            console.error('[Player] Failed to skip to previous track:', err);
            Toast.show({
                type: 'error',
                text1: 'Playback error',
                text2: 'Could not skip to previous track.'
            });
            await endSession();
        }
    };

    const skipToNextLocality = async () => {
        console.log('[Player] Skip to next locality');
        try {
            if (currentLocalityIndex < localities.length - 1) {
                const newLocalityIndex = currentLocalityIndex + 1;
                const flatIndex = calculateTrackFlatIndex(newLocalityIndex, 0, localities);
                await TrackPlayer.skip(flatIndex);
                setCurrentLocalityIndex(newLocalityIndex);
                setCurrentTrackIndex(0);
            } else {
                console.log('[Player] End of locality list, restarting from beginning');
                await TrackPlayer.skip(0);
                setCurrentLocalityIndex(0);
                setCurrentTrackIndex(0);
            }
        } catch (err) {
            console.error('[Player] Failed to skip to next locality:', err);
            Toast.show({
                type: 'error',
                text1: 'Playback error',
                text2: 'Could not skip to next locality.'
            });
            await endSession();
        }
    };

    const skipToPreviousLocality = async () => {
        console.log('[Player] Skip to previous locality');
        try {
            if (currentLocalityIndex > 0) {
                const newLocalityIndex = currentLocalityIndex - 1;
                const flatIndex = calculateTrackFlatIndex(newLocalityIndex, 0, localities);
                await TrackPlayer.skip(flatIndex);
                setCurrentLocalityIndex(newLocalityIndex);
                setCurrentTrackIndex(0);
            } else {
                console.log('[Player] At start of locality list, skipping to last locality');
                const newLocalityIndex = localities.length - 1;
                const lastTrackIndex = 0;
                const flatIndex = calculateTrackFlatIndex(newLocalityIndex, lastTrackIndex, localities);
                await TrackPlayer.skip(flatIndex);
                setCurrentLocalityIndex(newLocalityIndex);
                setCurrentTrackIndex(lastTrackIndex);
            }
        } catch (err) {
            console.error('[Player] Failed to skip to previous locality:', err);
            Toast.show({
                type: 'error',
                text1: 'Playback error',
                text2: 'Could not skip to previous locality.'
            });
            await endSession();
        }
    };

    useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
        if (!isSessionActive || !event.track) return;

        const compositeId = event.track.id;
        if (!compositeId) return;

        const [rawLocalityId, rawTrackId] = compositeId.split(":");
        const localityId = Number(rawLocalityId);
        const trackId = Number(rawTrackId);

        setLocalities((prevLocalities) => {
            const ghostPresent =
                typeof prevLocalities[0]?.locality_id === "string" &&
                prevLocalities[0].locality_id.startsWith("ghost-");

            let updatedLocalities = prevLocalities;

            if (ghostPresent) {
                TrackPlayer.remove(0)
                updatedLocalities = prevLocalities.slice(1);
            }

            for (let locIndex = 0; locIndex < updatedLocalities.length; locIndex++) {
                if (Number(updatedLocalities[locIndex].locality_id) === localityId) {
                    const trackIndex = updatedLocalities[locIndex].tracks.findIndex(
                        (t) => Number(t.track_id) === trackId
                    );
                    if (trackIndex !== -1) {
                        setCurrentLocalityIndex(locIndex);
                        setCurrentTrackIndex(trackIndex);
                        return updatedLocalities;
                    }
                }
            }

            return updatedLocalities;
        });
    });

    useTrackPlayerEvents([Event.PlaybackQueueEnded], () => {
        if (!isSessionActive) return;

        const isOnlyGhost = localities.length === 1 && localities[0]?.locality_id?.startsWith("ghost-");

        if (isOnlyGhost) {
            console.log("[Player] Ghost track finished — ending session");
            Toast.show({
                type: "info",
                text1: "Listening session ended",
                text2: "No other tracks found nearby.",
            });
            endSession();
        }
    });

    useEffect(() => {
        if (!isSessionActive || !userLocation) return;

        const handler = setTimeout(() => {
            console.log('[Player] Radius changed — refreshing tracks');
            Toast.show({
                type: 'info',
                text1: 'Search radius updated',
                text2: 'Refreshing tracks based on new location.'
            });
            (async () => {
                const success = await loadTracks(userLocation, sessionIdRef.current);
                if (!success) {
                    Toast.show({
                        type: 'error',
                        text1: 'Track refresh failed',
                        text2: 'Could not refresh tracks after radius change.',
                    });
                }
            })();
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [radius]);

    useEffect(() => {
        if (pathname?.startsWith("/auth") && isSessionActive) {
            console.log("[Player] Navigated to auth — ending session");
            endSession();
        }
    }, [pathname, isSessionActive]);

    useEffect(() => {
        const setup = async () => {
            try {
                await TrackPlayer.reset();
                console.log('[Player] Already initialised');
            } catch {
                await TrackPlayer.setupPlayer();
                await TrackPlayer.updateOptions({
                    android: {
                        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
                        alwaysPauseOnInterruption: true,
                        stopForegroundGracePeriod: 0
                    }
                });
                console.log('[Player] TrackPlayer initialised');
            }
        };
        setup();

        return () => {
            if (isSessionActive) {
                endSession();
            }
        };
    }, []);

    return (
        <PlayerContext.Provider
            value={{
                currentLocality,
                currentTrack,
                isPlaying,
                isSessionActive,
                playbackPosition,
                trackDuration,
                volume,
                radius,
                toggleSession,
                pause,
                resume,
                setVolume,
                setRadius,
                skipToNextTrack,
                skipToPreviousTrack,
                skipToNextLocality,
                skipToPreviousLocality,
                seekToPosition,
                canSkipTrack,
                canSkipLocality,
            }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = (): PlayerContextType => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
    return context;
};