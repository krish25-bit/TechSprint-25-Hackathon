"use client";

import { useEmergency } from "@/context/EmergencyContext";
import { AlertCircle, CheckCircle, Radio } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// ✅ IMPORTANT: Load the CORRECT map component
const GoogleMapView = dynamic(
  () => import("@/components/map/GoogleMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-800 text-white">
        Loading Tactical Map...
      </div>
    ),
  }
);

export default function AgencyDashboard() {
  const { incidents, resolveIncident } = useEmergency();

  const openIncidents = incidents.filter(
    (incident) => incident.status !== "RESOLVED"
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-900 text-white">
      {/* ================= SIDEBAR ================= */}
      <div className="w-full md:w-1/3 h-[40vh] md:h-full border-r-0 md:border-r border-t md:border-t-0 border-slate-700 flex flex-col order-2 md:order-1">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold flex items-center gap-2 text-red-500">
              <Radio className="animate-pulse" />
              Emergency Dispatch
            </h1>
          </Link>
          <p className="text-sm text-slate-400 mt-1">
            {openIncidents.length} Active Incidents
          </p>
        </div>

        {/* Incident List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {openIncidents.length === 0 && (
            <div className="text-center text-slate-500 mt-10 flex flex-col items-center gap-2">
              <AlertCircle size={24} />
              No active incidents. System monitoring…
            </div>
          )}

          {openIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors ${incident.priority === "CRITICAL"
                  ? "border-red-500 bg-red-900/10"
                  : ""
                }`}
            >
              {/* Priority + Time */}
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${incident.priority === "CRITICAL"
                      ? "bg-red-600"
                      : incident.priority === "HIGH"
                        ? "bg-orange-600"
                        : "bg-blue-600"
                    }`}
                >
                  {incident.priority}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(incident.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Incident Info */}
              <h3 className="font-bold text-lg">{incident.type}</h3>
              <p className="text-sm text-slate-300 mb-2">
                {incident.description}
              </p>

              {incident.placeName && (
                <p className="text-xs text-blue-300 mb-2">
                  📍 {incident.placeName}
                </p>
              )}

              {incident.peopleAffected &&
                incident.peopleAffected > 0 && (
                  <div className="text-xs text-yellow-400 font-semibold mb-2">
                    ⚠ {incident.peopleAffected} People Affected
                  </div>
                )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    resolveIncident(incident.id, "DISPATCHED")
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-xs py-2 rounded font-medium"
                >
                  Dispatch Team
                </button>
                <button
                  onClick={() =>
                    resolveIncident(incident.id, "RESOLVED")
                  }
                  className="bg-slate-700 hover:bg-green-600 text-xs px-3 py-2 rounded"
                  title="Mark as resolved"
                >
                  <CheckCircle size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MAP VIEW ================= */}
      <div className="flex-1 relative z-0 order-1 md:order-2">
        {/* ✅ NO PROPS NEEDED */}
        <GoogleMapView />
      </div>
    </div>
  );
}
