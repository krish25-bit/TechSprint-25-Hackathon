"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { SHELTERS, DANGER_ZONES } from "@/data/mockData";

// Fix default Leaflet icon issue
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface EmergencyPlace {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
  };
}

export default function MapView() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [emergencyPlaces, setEmergencyPlaces] = useState<EmergencyPlace[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch emergency departments using Overpass API
  async function fetchEmergencyPlaces(lat: number, lng: number) {
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:5000,${lat},${lng});
        node["amenity"="police"](around:5000,${lat},${lng});
        node["amenity"="fire_station"](around:5000,${lat},${lng});
      );
      out body;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });

    const data = await response.json();
    setEmergencyPlaces(data.elements || []);
  }

  // 📍 Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition([28.6139, 77.2090]); // fallback
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPosition([lat, lng]);
        await fetchEmergencyPlaces(lat, lng);
        setLoading(false);
      },
      async () => {
        const lat = 28.6139;
        const lng = 77.2090;
        setPosition([lat, lng]);
        await fetchEmergencyPlaces(lat, lng);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  if (loading || !position) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        Loading map…
      </div>
    );
  }

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom
      className="h-screen w-full"
    >
      {/* OpenStreetMap */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* USER LOCATION */}
      <Marker position={position} icon={markerIcon}>
        <Popup>
          <div className="font-bold text-blue-600">You are here</div>
        </Popup>
      </Marker>

      {/* SHELTERS */}
      {SHELTERS.map((shelter) => (
        <Marker
          key={shelter.id}
          position={[shelter.lat, shelter.lng]}
          icon={markerIcon}
        >
          <Popup>
            <div className="font-bold">{shelter.name}</div>
            <div>Capacity: {shelter.capacity}</div>
            <div className="text-green-600 font-semibold">Safe Zone</div>
          </Popup>
        </Marker>
      ))}

      {/* DANGER ZONES */}
      {DANGER_ZONES.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.lat, zone.lng]}
          radius={zone.radius}
          pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.4 }}
        >
          <Popup>
            <div className="font-bold text-red-600">
              ⚠ Danger Zone: {zone.name}
            </div>
            <div>Severity: {zone.severity}</div>
          </Popup>
        </Circle>
      ))}

      {/* EMERGENCY DEPARTMENTS */}
      {emergencyPlaces.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lon]}
          icon={markerIcon}
        >
          <Popup>
            <div className="font-bold capitalize">
              {place.tags?.amenity?.replace("_", " ")}
            </div>
            <div>{place.tags?.name || "Unnamed Facility"}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
