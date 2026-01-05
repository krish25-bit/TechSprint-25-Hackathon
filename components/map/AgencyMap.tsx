"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/context/GoogleMapsContext";
import { Incident } from "@/context/EmergencyContext";
import React, { useState, useCallback, useEffect } from "react";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const fallbackCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

interface AgencyMapProps {
  incidents: Incident[];
}

export default function AgencyMap({ incidents }: AgencyMapProps) {
  const { isLoaded, userLocation, refreshLocation } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // 🔥 AUTO-DETECT LOCATION
  useEffect(() => {
    if (!userLocation) {
      refreshLocation();
    }
  }, [userLocation, refreshLocation]);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      if (userLocation) {
        map.panTo(userLocation);
      }
    },
    [userLocation]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // 🔥 FIT MAP TO INCIDENTS + USER LOCATION
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    incidents.forEach((inc) => {
      bounds.extend(inc.location);
      hasBounds = true;
    });

    if (userLocation) {
      bounds.extend(userLocation);
      hasBounds = true;
    }

    if (hasBounds) {
      map.fitBounds(bounds);
    }
  }, [map, incidents, userLocation]);

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-800 text-white">
        Loading Agency Map...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || fallbackCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {/* INCIDENT MARKERS */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            position={incident.location}
            title={`${incident.type} - ${incident.priority}`}
          />
        ))}

        {/* USER LOCATION */}
        {userLocation && (
          <Marker
            position={userLocation}
            title="You are here"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
