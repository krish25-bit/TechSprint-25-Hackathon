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
    id: string;
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
        incident: Omit<Incident, "id" | "timestamp" | "status">
    ) => void;
    resolveIncident: (id: string, status: IncidentStatus) => void;
}

/* -------------------- CONTEXT -------------------- */

const EmergencyContext = createContext<EmergencyContextType | undefined>(
    undefined
);

/* -------------------- PROVIDER -------------------- */

export function EmergencyProvider({ children }: { children: React.ReactNode }) {
    const [incidents, setIncidents] = useState<Incident[]>([]);

    /* -------- LOAD FROM LOCAL STORAGE -------- */
    /* -------- LOAD FROM LOCAL STORAGE -------- */
    useEffect(() => {
        if (typeof window === "undefined") return;

        const saved = localStorage.getItem("disaster_incidents");
        if (saved) {
            try {
                const parsed: Incident[] = JSON.parse(saved);
                // Filter out the "Bad Fallback" location (New Delhi)
                const cleanData = parsed.filter(i =>
                    !(Math.abs(i.location.lat - 28.6139) < 0.0001 && Math.abs(i.location.lng - 77.2090) < 0.0001)
                );
                setIncidents(cleanData);
            } catch (e) {
                console.error("Failed to parse incidents", e);
            }
        }
    }, []);

    /* -------- SAVE TO LOCAL STORAGE -------- */
    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem("disaster_incidents", JSON.stringify(incidents));
    }, [incidents]);

    /* -------- SYNC BETWEEN TABS -------- */
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "disaster_incidents" && e.newValue) {
                setIncidents(JSON.parse(e.newValue));
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () =>
            window.removeEventListener("storage", handleStorageChange);
    }, []);

    /* -------------------- ACTIONS -------------------- */

    const addIncident = (
        data: Omit<Incident, "id" | "timestamp" | "status">
    ) => {
        const newIncident: Incident = {
            ...data,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            status: "OPEN",
        };

        setIncidents((prev) => [newIncident, ...prev]);
    };

    const resolveIncident = (id: string, status: IncidentStatus) => {
        setIncidents((prev) =>
            prev.map((inc) =>
                inc.id === id ? { ...inc, status } : inc
            )
        );
    };

    return (
        <EmergencyContext.Provider
            value={{ incidents, addIncident, resolveIncident }}
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
