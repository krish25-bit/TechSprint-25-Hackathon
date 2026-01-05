"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeEmergencyInput } from '@/lib/ai-agent';
import { useEmergency } from '@/context/EmergencyContext';
import { useGoogleMaps } from '@/context/GoogleMapsContext';

// Type definitions for Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export default function useVoiceAssistant() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiResponse, setAiResponse] = useState("");

    const recognitionRef = useRef<any>(null);
    const { addIncident } = useEmergency();

    // Initialize Speech Recognition
    useEffect(() => {
        const { webkitSpeechRecognition } = window as unknown as IWindow;
        if (!webkitSpeechRecognition) return;

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false; // Stop after one sentence
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            setTranscript(text);
            handleCommand(text);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, []);

    // Text to Speech
    const speak = useCallback((text: string) => {
        setAiResponse(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }, []);

    const { mapInstance, isLoaded: isMapsLoaded, userLocation } = useGoogleMaps();

    // AI Command Parser Integration
    const handleCommand = (text: string) => {
        // 1. Analyze Input using AI Agent
        const analysis = analyzeEmergencyInput(text);

        // 2. Logic Branching: Find Shelter / Directions - DISABLED (No Places/Directions API)
        if (text.toLowerCase().includes("shelter") || text.toLowerCase().includes("hospital")) {
            speak("I am sorry, but searching for nearby places is currently disabled.");
            return;
        }

        // 3. Handle Critical Emergencies
        if (analysis.priority === 'CRITICAL' || analysis.priority === 'HIGH' || analysis.type !== 'Other') {

            const report = (loc: { lat: number; lng: number }, address?: string) => {
                addIncident({
                    type: analysis.type,
                    priority: analysis.priority,
                    description: analysis.description,
                    peopleAffected: analysis.peopleAffected,
                    location: loc,
                    placeName: address
                });
                speak(`Alert Sent! Reported ${analysis.type} at ${address || 'location'}. Emergency teams notified.`);
            };

            // Use GPS Location Directly (No Geocoding API)
            if (userLocation) {
                // If the user provided a location description, we pass it as text, but map to current GPS
                const locationDesc = analysis.locationEstimate && analysis.locationEstimate !== "GPS Location Preferred"
                    ? `Current Location (Reported: ${analysis.locationEstimate})`
                    : "Current GPS Location";

                report(userLocation, locationDesc);
            } else {
                // Fallback if no GPS
                report({ lat: 28.6139, lng: 77.2090 }, "Default Location (GPS Unavailable)");
            }
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return { isListening, transcript, aiResponse, startListening, stopListening, speak, handleCommand };
}
