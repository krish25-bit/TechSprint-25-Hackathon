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
    DirectionsRenderer,
    InfoWindow,
} from "@react-google-maps/api";

import { useGoogleMaps } from "@/context/GoogleMapsContext";
import { useEmergency } from "@/context/EmergencyContext";
import { Crosshair, AlertTriangle, Clock, MapPin } from "lucide-react";

const containerStyle = {
    width: "100%",
    height: "100vh",
};

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090,
};

const ICONS = {
    hospital: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    police: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    fire_station: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
};

type EmergencyType = "hospital" | "police" | "fire_station";

interface PlaceWithType extends google.maps.places.PlaceResult {
    emergencyType: EmergencyType;
}

function GoogleMapView() {
    const {
        isLoaded,
        setMapInstance,
        directionsResponse,
        setDirectionsResponse,
        userLocation,
        refreshLocation,
        locationStatus,
        locationAccuracy,
    } = useGoogleMaps();

    const { incidents } = useEmergency();

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [places, setPlaces] = useState<PlaceWithType[]>([]);
    const [selectedPlace, setSelectedPlace] =
        useState<PlaceWithType | null>(null);
    const [nearestPlace, setNearestPlace] =
        useState<PlaceWithType | null>(null);
    const [routeInfo, setRouteInfo] =
        useState<{ distance: string; duration: string } | null>(null);

    const searchedRef = useRef(false);

    // ... (keeping existing logic)

    // ---------------- UI RENDER ----------------
    // ... (keeping existing markers logic)




    // 🔥 AUTO-DETECT LOCATION ON LOAD
    useEffect(() => {
        if (!userLocation) {
            refreshLocation();
        } else {
            searchedRef.current = false; // allow new search when location updates
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

    // ---------------- PLACES + ROUTING ----------------
    useEffect(() => {
        if (!map || !userLocation || searchedRef.current) return;
        if (!google.maps.places || !google.maps.geometry) return;

        searchedRef.current = true;

        const service = new google.maps.places.PlacesService(map);
        const types: EmergencyType[] = ["hospital", "police", "fire_station"];

        let collected: PlaceWithType[] = [];
        let completed = 0;

        types.forEach((type) => {
            service.nearbySearch(
                {
                    location: new google.maps.LatLng(
                        userLocation.lat,
                        userLocation.lng
                    ),
                    radius: 5000,
                    type,
                },
                (results, status) => {
                    completed++;

                    if (
                        status === google.maps.places.PlacesServiceStatus.OK &&
                        results
                    ) {
                        collected.push(
                            ...results.map((p) => ({
                                ...p,
                                emergencyType: type,
                            }))
                        );
                    }

                    if (completed === types.length) {
                        const unique = collected.filter(
                            (p, i, arr) =>
                                i === arr.findIndex((x) => x.place_id === p.place_id)
                        );

                        setPlaces(unique);

                        let nearest: PlaceWithType | null = null;
                        let minDist = Infinity;

                        unique.forEach((p) => {
                            if (p.geometry?.location) {
                                const dist =
                                    google.maps.geometry.spherical.computeDistanceBetween(
                                        new google.maps.LatLng(userLocation),
                                        p.geometry.location
                                    );
                                if (dist < minDist) {
                                    minDist = dist;
                                    nearest = p;
                                }
                            }
                        });

                        setNearestPlace(nearest);

                        if (nearest?.geometry?.location) {
                            const dirService = new google.maps.DirectionsService();
                            dirService.route(
                                {
                                    origin: userLocation,
                                    destination: nearest.geometry.location,
                                    travelMode: google.maps.TravelMode.DRIVING,
                                },
                                (res, status) => {
                                    if (status === "OK" && res) {
                                        setDirectionsResponse(res);
                                        const leg = res.routes[0].legs[0];
                                        setRouteInfo({
                                            distance: leg.distance?.text || "",
                                            duration: leg.duration?.text || "",
                                        });
                                    }
                                }
                            );
                        }
                    }
                }
            );
        });
    }, [map, userLocation, setDirectionsResponse]);

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

                {/* EMERGENCY PLACES */}
                {places.map(
                    (p) =>
                        p.geometry?.location && (
                            <Marker
                                key={p.place_id}
                                position={p.geometry.location}
                                icon={ICONS[p.emergencyType]}
                                onClick={() => setSelectedPlace(p)}
                            />
                        )
                )}

                {/* INFO WINDOW */}
                {selectedPlace && selectedPlace.geometry?.location && (
                    <InfoWindow
                        position={selectedPlace.geometry.location}
                        onCloseClick={() => setSelectedPlace(null)}
                    >
                        <div className="text-black">
                            <h3 className="font-bold">{selectedPlace.name}</h3>
                            <p className="capitalize">
                                {selectedPlace.emergencyType.replace("_", " ")}
                            </p>
                            <p className="text-xs">{selectedPlace.vicinity}</p>
                        </div>
                    </InfoWindow>
                )}

                {/* ROUTE */}
                {directionsResponse && (
                    <DirectionsRenderer
                        directions={directionsResponse}
                        options={{ suppressMarkers: true }}
                    />
                )}
            </GoogleMap>

            {/* INFO PANEL */}
            {/* RELOCATE BUTTON - Re-added with high Z-index */}
            <div className="absolute bottom-32 right-4 flex flex-col gap-2 z-[1000]">
                <button
                    onClick={() => {
                        searchedRef.current = false;
                        refreshLocation();
                    }}
                    className={`bg-white text-slate-900 p-3 rounded-full shadow-lg hover:bg-slate-100 transition-colors flex items-center justify-center ${locationStatus === "locating" ? "animate-spin" : ""}`}
                    title="Find My Location"
                >
                    <Crosshair size={24} />
                </button>
            </div>

            {nearestPlace && routeInfo && (
                <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg w-80">
                    <p className="text-xs uppercase text-gray-400">
                        Nearest Emergency
                    </p>
                    <h2 className="text-lg font-bold">{nearestPlace.name}</h2>
                    <div className="flex gap-4 mt-3">
                        <div>
                            <Clock size={16} /> {routeInfo.duration}
                        </div>
                        <div>
                            <MapPin size={16} /> {routeInfo.distance}
                        </div>
                    </div>
                </div>
            )}


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
