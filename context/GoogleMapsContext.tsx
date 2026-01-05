"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useState,
    useEffect,
    useCallback,
} from "react";
import { useJsApiLoader } from "@react-google-maps/api";

/* -------------------- TYPES -------------------- */

type LocationStatus = "idle" | "locating" | "found" | "error" | "denied";

interface GoogleMapsContextType {
    isLoaded: boolean;
    loadError: Error | undefined;
    mapInstance: google.maps.Map | null;
    setMapInstance: (map: google.maps.Map | null) => void;

    userLocation: { lat: number; lng: number } | null;
    locationStatus: LocationStatus;
    locationError: string | null;
    refreshLocation: () => void;
    locationAccuracy: number | null;
}

/* -------------------- CONTEXT -------------------- */

const GoogleMapsContext = createContext<GoogleMapsContextType>(
    {} as GoogleMapsContextType
);

/* -------------------- LIBRARIES -------------------- */

const libraries: ("places" | "geometry")[] = ["places"];

/* -------------------- PROVIDER -------------------- */

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    const [mapInstance, setMapInstance] =
        useState<google.maps.Map | null>(null);



    const [userLocation, setUserLocation] =
        useState<{ lat: number; lng: number } | null>(null);

    const [locationStatus, setLocationStatus] =
        useState<LocationStatus>("idle");

    const [locationError, setLocationError] =
        useState<string | null>(null);

    const [locationAccuracy, setLocationAccuracy] =
        useState<number | null>(null);

    /* -------------------- LOCATION -------------------- */

    const refreshLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationStatus("error");
            setLocationError("Geolocation not supported");
            return;
        }

        setLocationStatus("locating");
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setLocationAccuracy(pos.coords.accuracy);
                setLocationStatus("found");
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setLocationStatus("denied");
                    setLocationError("Location permission denied");
                } else {
                    setLocationStatus("error");
                    setLocationError(err.message);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );
    }, []);

    /* -------------------- EFFECTS -------------------- */

    // Start location automatically on mount (independent of Maps script)
    useEffect(() => {
        refreshLocation();
    }, [refreshLocation]);

    useEffect(() => {
        if (loadError) {
            console.error("❌ Google Maps load error:", loadError);
        }
    }, [loadError]);

    /* -------------------- PROVIDER -------------------- */

    return (
        <GoogleMapsContext.Provider
            value={{
                isLoaded,
                loadError,
                mapInstance,
                setMapInstance,

                userLocation,
                locationStatus,
                locationError,
                refreshLocation,
                locationAccuracy,
            }}
        >
            {children}
        </GoogleMapsContext.Provider>
    );
}

/* -------------------- HOOK -------------------- */

export const useGoogleMaps = () => useContext(GoogleMapsContext);
