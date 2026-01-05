"use client";

import { useEmergency } from "@/context/EmergencyContext";
import { AlertCircle, CheckCircle, Siren, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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
  const { incidents, resolveIncident, addIncident, clearIncidents } = useEmergency();
  const router = useRouter();
  const [agencyUser, setAgencyUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    // Load logged-in user
    const savedUser = localStorage.getItem("agency_user");
    if (savedUser) {
      setAgencyUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("agency_token");
    localStorage.removeItem("agency_user");
    router.push("/agency/login");
  };




  const handleSimulateIncident = () => {
    // Creates a fake incident to demo the system
    const fakeLocations = [
      { lat: 28.6200, lng: 77.2100 }, // Near Center
      { lat: 28.6100, lng: 77.2000 },
      { lat: 28.6300, lng: 77.2200 },
    ];
    const randomLoc = fakeLocations[Math.floor(Math.random() * fakeLocations.length)];

    addIncident({
      type: "Fire",
      priority: "CRITICAL",
      description: "SIMULATION: Fire reported at residential complex. Verify immediately.",
      location: randomLoc,
      placeName: "Simulated Location",
      peopleAffected: Math.floor(Math.random() * 20) + 1,
    });
  };

  const openIncidents = incidents.filter(
    (incident) => incident.status !== "RESOLVED"
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-900 text-white">
      {/* ================= SIDEBAR ================= */}
      <div className="w-full md:w-1/3 h-[40vh] md:h-full border-r-0 md:border-r border-t md:border-t-0 border-slate-700 flex flex-col order-2 md:order-1">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold flex items-center gap-2 text-white">
                Emergency Dispatch
              </h1>
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const type = prompt("Enter Incident Type (e.g. Fire, Flood):");
                  if (type) alert(`Adding incident: ${type}`);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                title="Add Manually"
              >
                + Add
              </button>
              <button
                onClick={() => clearIncidents()}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors border border-slate-600"
                title="Clear All Red Marks"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg border border-slate-600">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Logged in as</p>
              <p className="font-medium text-white">{agencyUser?.name || "Officer"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>



          <div className="mt-4 flex justify-between items-end">
            <p className="text-sm text-slate-400">
              {openIncidents.length} Active Incidents
            </p>
            {/* SIMULATION BUTTON */}
            <button
              onClick={handleSimulateIncident}
              className="text-xs bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 border border-yellow-600/50 px-3 py-1.5 rounded flex items-center gap-2 transition-all"
            >
              <Siren size={14} />
              Simulate Call
            </button>
          </div>
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
                ? "border-orange-500 bg-orange-900/10"
                : ""
                }`}
            >
              {/* Priority + Time */}
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${incident.priority === "CRITICAL"
                    ? "bg-orange-600"
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
