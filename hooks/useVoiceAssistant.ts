/// <reference types="google.maps" />
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

    const { mapInstance, isLoaded: isMapsLoaded, userLocation, setSearchResults, setDirectionsResponse, isDemoMode } = useGoogleMaps();

    // AI Command Parser Integration
    const handleCommand = (text: string) => {
        // 0. DEMO MODE INTERCEPT
        if (isDemoMode && text.toLowerCase().includes("demo")) {
            speak("Demo Mode is active. I have simulated a Flood Incident near India Gate. You can ask me to find a hospital or get directions.");
            return;
        }

        // 1. Analyze Input using AI Agent
        const analysis = analyzeEmergencyInput(text);

        // 2. Logic Branching: Directions
        if (text.toLowerCase().includes("direction") || text.toLowerCase().includes("go to") || text.toLowerCase().includes("navigate")) {
            if (!mapInstance || !userLocation) {
                speak("I cannot get directions right now. Map or location is not ready.");
                return;
            }

            // Simple keyword extraction (naive) - can be improved with AI
            // e.g. "directions to hospital" -> "hospital"
            // For now, we search for generic targets or assume nearest shelter if unspecified
            let query = "shelter";
            if (text.toLowerCase().includes("hospital")) query = "hospital";

            const placesService = new google.maps.places.PlacesService(mapInstance);
            placesService.nearbySearch(
                {
                    location: userLocation,
                    radius: 5000,
                    keyword: query
                },
                (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                        // Get directions to the first result
                        const destination = results[0].geometry?.location;
                        if (!destination) return;

                        const directionsService = new google.maps.DirectionsService();
                        directionsService.route({
                            origin: userLocation,
                            destination: destination,
                            travelMode: google.maps.TravelMode.DRIVING
                        }, (result, status) => {
                            if (status === google.maps.DirectionsStatus.OK) {
                                setDirectionsResponse(result);
                                speak(`Showing directions to the nearest ${query}: ${results[0].name}`);
                            } else {
                                speak("Sorry, I could not calculate the route.");
                            }
                        });

                    } else {
                        speak(`Sorry, I could not find any ${query} nearby to navigate to.`);
                    }
                }
            );
            return;
        }

        // 3a. DEMO MODE: Find Places
        if (isDemoMode && (text.toLowerCase().includes("hospital") || text.toLowerCase().includes("shelter"))) {
            const fakePlaces = [
                {
                    place_id: "demo_1",
                    name: "Demo City Hospital (Simulated)",
                    geometry: { location: { lat: 28.6100, lng: 77.2300 } },
                    vicinity: "Demo District"
                },
                {
                    place_id: "demo_2",
                    name: "Emergency Shelter Alpha (Simulated)",
                    geometry: { location: { lat: 28.6200, lng: 77.2100 } },
                    vicinity: "Safe Zone"
                }
            ] as unknown as google.maps.places.PlaceResult[];
            setSearchResults(fakePlaces);
            speak(`Demo Mode: Found ${fakePlaces.length} simulated locations nearby.`);
            return;
        }

        // 2a. DEMO MODE: Directions
        if (isDemoMode && (text.toLowerCase().includes("direction") || text.toLowerCase().includes("navigate"))) {
            if (!userLocation) {
                speak("Waiting for demo location...");
                return;
            }
            const fakeHospital = { lat: 28.6100, lng: 77.2300 }; // Fake Hospital Location
            speak("Demo Mode: Navigating to the nearest Emergency Center (Simulated).");

            const directionsService = new google.maps.DirectionsService();
            directionsService.route({
                origin: userLocation,
                destination: fakeHospital,
                travelMode: google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirectionsResponse(result);
                } else {
                    speak("Demo Navigation failed. Please check map configuration.");
                }
            });
            return;
        }

        // 3. Logic Branching: Find Shelter (Search Only)
        if (text.toLowerCase().includes("shelter") || text.toLowerCase().includes("hospital") || text.toLowerCase().includes("find")) {
            if (!mapInstance || !userLocation) {
                speak("I cannot search for places right now. Map or location is not ready.");
                return;
            }

            const keyword = text.toLowerCase().includes("hospital") ? "hospital" : "shelter";

            const service = new google.maps.places.PlacesService(mapInstance);
            service.nearbySearch(
                {
                    location: userLocation,
                    radius: 5000,
                    keyword: keyword
                },
                (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        setSearchResults(results);
                        speak(`Found ${results.length} ${keyword}s nearby. check the map.`);
                    } else {
                        speak(`Sorry, I could not find any ${keyword}s nearby.`);
                    }
                }
            );
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
