"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import MapWrapper from "@/components/map/MapWrapper";
import useVoiceAssistant from "@/hooks/useVoiceAssistant";
import { useEmergency } from "@/context/EmergencyContext";
import { useGoogleMaps } from "@/context/GoogleMapsContext";

import { Mic, AlertTriangle, Volume2, Send } from "lucide-react";

export default function Home() {
  const {
    isListening,
    transcript,
    aiResponse,
    startListening,
    stopListening,
    handleCommand,
  } = useVoiceAssistant();

  const { addIncident } = useEmergency();
  const { userLocation, refreshLocation, locationStatus } = useGoogleMaps();

  const [textInput, setTextInput] = useState("");

  // 🔥 AUTO-DETECT LOCATION ON PAGE LOAD
  useEffect(() => {
    if (!userLocation && locationStatus !== "locating") {
      refreshLocation();
    }
  }, [userLocation, locationStatus, refreshLocation]);

  const handleSend = () => {
    if (!textInput.trim()) return;
    handleCommand(textInput);
    setTextInput("");
  };

  const handleSOS = () => {
    const sosLocation = userLocation || { lat: 28.6139, lng: 77.2090 };

    if (!userLocation) {
      alert("⚠ Location not detected. Sending last known / default location.");
    }

    addIncident({
      type: "General SOS",
      priority: "CRITICAL",
      location: sosLocation,
      description: "Manual SOS Button Pressed",
      peopleAffected: 1,
    });

    alert("🚨 SOS Sent! Emergency agencies notified.");
  };

  return (
    <main className="relative h-screen w-full flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* ================= TOP BAR ================= */}
      <div className="absolute top-0 left-0 w-full z-[1000] p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center pointer-events-none">
        {/* Logo */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur px-4 py-2 rounded-xl border border-slate-700 shadow-xl">
          <h1 className="font-bold text-lg md:text-xl tracking-wider text-blue-400">
            Disaster<span className="text-white">Voice</span>
          </h1>
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            href="/agency"
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 backdrop-blur px-3 py-2 rounded-lg border border-slate-600 transition-colors"
          >
            Agency Dashboard
          </Link>

          <button
            onClick={handleSOS}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <AlertTriangle size={16} /> Report SOS
          </button>
        </div>
      </div>

      {/* ================= MAP ================= */}
      <div className="flex-grow relative z-0">
        <MapWrapper />
      </div>

      {/* ================= VOICE UI ================= */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-4 w-full px-4 pointer-events-none">
        {/* Transcript / AI Response */}
        {(transcript || aiResponse) && (
          <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 text-center max-w-md pointer-events-auto">
            {transcript && (
              <p className="text-slate-300 text-sm mb-1">
                You: "{transcript}"
              </p>
            )}
            {aiResponse && (
              <p className="text-blue-400 font-bold flex items-center gap-2 justify-center">
                <Volume2 size={16} /> {aiResponse}
              </p>
            )}
          </div>
        )}

        <div
          className={`bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center gap-2 transition-all w-full max-w-md pointer-events-auto ${isListening
            ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            : ""
            }`}
        >
          <div className="text-slate-400 text-sm font-medium mb-2">
            {isListening ? "Listening..." : "Tap to Speak"}
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-blue-600 hover:bg-blue-500"
              }`}
          >
            <Mic size={32} className="text-white" />
          </button>

          <div className="flex gap-2 w-full mt-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a command (e.g., 'Fire at Market')..."
              className="flex-1 bg-slate-800/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg"
            >
              <Send size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-2 text-center">
            Try: “Nearest hospital” or “Fire emergency”
          </p>
        </div>
      </div>
    </main>
  );
}
