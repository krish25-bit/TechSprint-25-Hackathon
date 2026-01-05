"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function MapWrapper() {
  const GoogleMapView = useMemo(
    () =>
      dynamic(() => import("@/components/map/GoogleMapView"), {
        loading: () => (
          <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
            Loading Map Data...
          </div>
        ),
        ssr: false,
      }),
    []
  );

  return <GoogleMapView />;
}
