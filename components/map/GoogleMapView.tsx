/// <reference types="google.maps" />
"use client";

import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
    memo,
} from "react";

import {
    GoogleMap,
    Marker,
} from "@react-google-maps/api";

import { useGoogleMaps } from "@/context/GoogleMapsContext";
import { useEmergency } from "@/context/EmergencyContext";
import { AlertTriangle, Crosshair } from "lucide-react";

const containerStyle = {
    width: "100%",
    height: "100vh",
};

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090,
};

function GoogleMapView() {
    const {
        isLoaded,
        setMapInstance,
        userLocation,
        refreshLocation,
        locationStatus,
        locationAccuracy,
    } = useGoogleMaps();

    const { incidents } = useEmergency();

    const [map, setMap] = useState<google.maps.Map | null>(null);

    // ---------------- UI RENDER ----------------

    // 🔥 AUTO-DETECT LOCATION ON LOAD
    useEffect(() => {
        if (!userLocation) {
            refreshLocation();
        }
    }, [userLocation, refreshLocation]);

    // ---------------- MAP LOAD ----------------
    const onLoad = useCallback(
        (map: google.maps.Map) => {
            setMap(map);
            setMapInstance(map);
        },
        [setMapInstance]
    );

    const onUnmount = useCallback(() => {
        setMap(null);
        setMapInstance(null);
    }, [setMapInstance]);

    if (!isLoaded) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                Loading Google Maps…
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={userLocation || defaultCenter}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    zoomControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                }}
            >
                {/* USER */}
                {/* USER LOCATION - ALWAYS SHOW */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#3b82f6",
                            fillOpacity: 1,
                            strokeColor: "white",
                            strokeWeight: 2,
                        }}
                    />
                )}

                {/* INCIDENTS - Hide if overlapping with user location */}
                {incidents
                    .filter(i => !userLocation || (Math.abs(i.location.lat - userLocation.lat) > 0.0001 || Math.abs(i.location.lng - userLocation.lng) > 0.0001))
                    .map((i) => (
                        <Marker key={i.id} position={i.location} />
                    ))}
            </GoogleMap>

            {/* INFO PANEL */}
            {/* RELOCATE BUTTON - Re-added with high Z-index */}
            <div className="absolute bottom-32 right-4 flex flex-col gap-2 z-[1000]">
                <button
                    onClick={() => {
                        refreshLocation();
                    }}
                    className={`bg-white text-slate-900 p-3 rounded-full shadow-lg hover:bg-slate-100 transition-colors flex items-center justify-center ${locationStatus === "locating" ? "animate-spin" : ""}`}
                    title="Find My Location"
                >
                    <Crosshair size={24} />
                </button>
            </div>

            {/* ACCURACY WARNING */}
            {locationAccuracy && locationAccuracy > 500 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2 z-[1000]">
                    <AlertTriangle size={16} /> Low GPS accuracy ({Math.round(locationAccuracy)}m)
                </div>
            )}

            {/* ERROR WARNINGS */}
            {locationStatus === 'denied' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 z-[1000]">
                    <AlertTriangle size={16} /> Location Access Denied. Please enable GPS.
                </div>
            )}

            {locationStatus === 'error' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-offset-orange-500 bg-orange-500 text-white px-4 py-2 rounded flex items-center gap-2 z-[1000]">
                    <AlertTriangle size={16} /> Location Unavailable. Retrying...
                </div>
            )}
        </div>
    );
}

export default memo(GoogleMapView);
