"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

/* -------------------- TYPES -------------------- */

export type IncidentType =
    | "Flood"
    | "Fire"
    | "Medical"
    | "Earthquake"
    | "Cyclone"
    | "General SOS"
    | "Other";

export type IncidentPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus = "OPEN" | "RESOLVED" | "DISPATCHED";

export interface Incident {
    _id: string; // Mongo ID
    id: string;  // Kept for compatibility, mapped to _id usually
    type: IncidentType;
    priority: IncidentPriority;
    description: string;
    peopleAffected?: number;
    location: { lat: number; lng: number };
    placeName?: string;
    timestamp: string;
    status: IncidentStatus;
}

interface EmergencyContextType {
    incidents: Incident[];
    addIncident: (
        incident: Omit<Incident, "id" | "_id" | "timestamp" | "status">
    ) => Promise<void>;
    resolveIncident: (id: string, status: IncidentStatus) => Promise<void>;
    clearIncidents: () => void;
}

/* -------------------- CONTEXT -------------------- */

const EmergencyContext = createContext<EmergencyContextType | undefined>(
    undefined
);

/* -------------------- PROVIDER -------------------- */

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
    const [incidents, setIncidents] = useState<Incident[]>([]);

    // Initial Fetch & Polling
    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const res = await fetch('/api/incidents');
                if (res.ok) {
                    const data = await res.json();
                    // Transform _id to id for frontend compatibility if needed
                    const mapped = data.map((item: any) => ({
                        ...item,
                        id: item._id // Map Mongo _id to id for frontend components
                    }));
                    setIncidents(mapped);
                }
            } catch (error) {
                console.error("Failed to fetch incidents:", error);
            }
        };

        // Fetch immediately
        fetchIncidents();

        // POLL every 3 seconds for "Real-Time" updates
        const interval = setInterval(fetchIncidents, 3000);

        return () => clearInterval(interval);
    }, []);

    /* -------------------- ACTIONS -------------------- */

    const addIncident = async (
        data: Omit<Incident, "id" | "_id" | "timestamp" | "status">
    ) => {
        try {
            const res = await fetch('/api/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    status: 'OPEN',
                }),
            });

            if (res.ok) {
                const newIncident = await res.json();
                setIncidents((prev) => [{ ...newIncident, id: newIncident._id }, ...prev]);
            }
        } catch (error) {
            console.error("Failed to add incident:", error);
        }
    };

    const resolveIncident = async (id: string, status: IncidentStatus) => {
        try {
            // Optimistic Update
            setIncidents((prev) =>
                prev.map((inc) =>
                    inc.id === id ? { ...inc, status } : inc
                )
            );

            await fetch(`/api/incidents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
        } catch (error) {
            console.error("Failed to update status:", error);
            // Revert could be implemented here
        }
    };

    const clearIncidents = () => {
        setIncidents([]);
    };

    return (
        <EmergencyContext.Provider
            value={{ incidents, addIncident, resolveIncident, clearIncidents }}
        >
            {children}
        </EmergencyContext.Provider>
    );
}

/* -------------------- HOOK -------------------- */

export function useEmergency() {
    const context = useContext(EmergencyContext);
    if (!context) {
        throw new Error(
            "useEmergency must be used within an EmergencyProvider"
        );
    }
    return context;
}
