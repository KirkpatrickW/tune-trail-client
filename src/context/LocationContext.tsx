import { LocationPermissionRequiredModal } from '@/components/location/LocationPermissionRequiredModal';
import * as Location from "expo-location";
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    AppState
} from 'react-native';

interface LocationContextType {
    userLocation: Location.LocationObject | null;
    permissionGranted: boolean | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

    const checkPermissionsAndLocation = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        const isGranted = status === "granted";

        setPermissionGranted(isGranted);

        if (isGranted) {
            const loc = await Location.getCurrentPositionAsync({});
            setUserLocation(loc);

            Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
                (newLocation) => setUserLocation(newLocation)
            );
        }
    };

    useEffect(() => {
        checkPermissionsAndLocation();

        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                checkPermissionsAndLocation();
            }
        });

        return () => subscription.remove();
    }, []);

    return (
        <LocationContext.Provider value={{ userLocation, permissionGranted }}>
            <>
                {children}
                <LocationPermissionRequiredModal permissionGranted={permissionGranted} />
            </>
        </LocationContext.Provider>
    );
};

export const useLocation = (): LocationContextType => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};
