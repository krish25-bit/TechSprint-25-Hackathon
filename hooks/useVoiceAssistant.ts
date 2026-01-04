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

    const { mapInstance, setDirectionsResponse, isLoaded: isMapsLoaded, userLocation } = useGoogleMaps();

    // AI Command Parser Integration
    const handleCommand = (text: string) => {
        // 1. Analyze Input using AI Agent
        const analysis = analyzeEmergencyInput(text);

        // 2. Logic Branching: Find Shelter / Directions
        if (text.toLowerCase().includes("shelter") || text.toLowerCase().includes("hospital")) {
            if (!isMapsLoaded || !mapInstance) {
                speak("I am connecting to map data, please wait a moment.");
                return;
            }

            const type = text.toLowerCase().includes("hospital") ? "hospital" : "school"; // school as shelter proxy
            const currentLocation = userLocation || { lat: 28.6139, lng: 77.2090 };

            const service = new google.maps.places.PlacesService(mapInstance);
            service.nearbySearch({
                location: currentLocation,
                radius: 5000,
                type: type
            }, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                    const place = results[0];
                    speak(`Nearest ${type === 'school' ? 'shelter' : 'hospital'} is ${place.name}. showing route.`);

                    const dirService = new google.maps.DirectionsService();
                    dirService.route({
                        origin: currentLocation,
                        destination: place.geometry?.location || "",
                        travelMode: google.maps.TravelMode.DRIVING
                    }, (result, status) => {
                        if (status === 'OK') {
                            setDirectionsResponse(result);
                        }
                    });
                } else {
                    speak(`I could not find any ${type === 'school' ? 'shelters' : 'hospitals'} nearby.`);
                }
            });
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

            // Geocoding
            // Geocoding Logic
            if (analysis.locationEstimate && analysis.locationEstimate !== "GPS Location Preferred" && isMapsLoaded) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: analysis.locationEstimate }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const l = results[0].geometry.location;
                        report({ lat: l.lat(), lng: l.lng() }, results[0].formatted_address);
                    } else {
                        // Fallback: If address search fails, use LIVE USER LOCATION
                        if (userLocation) {
                            geocoder.geocode({ location: userLocation }, (res, stat) => {
                                const placeName = (stat === 'OK' && res && res[0]) ? res[0].formatted_address : "Current Location";
                                report(userLocation, placeName + " (Address Warning: '" + analysis.locationEstimate + "' not found)");
                            });
                        } else {
                            // Only fallback to default if userLocation is ALSO missing
                            report({ lat: 28.6139, lng: 77.2090 }, "Unknown Location (GPS & Address Failed)");
                        }
                    }
                });
            } else {
                // Use GPS Location Directly
                if (userLocation) {
                    if (isMapsLoaded) {
                        const geocoder = new google.maps.Geocoder();
                        geocoder.geocode({ location: userLocation }, (results, status) => {
                            const address = (status === 'OK' && results && results[0]) ? results[0].formatted_address : "Current GPS Location";
                            report(userLocation, address);
                        });
                    } else {
                        report(userLocation, "Current GPS Location");
                    }
                } else {
                    // Only fallback to default if userLocation is missing
                    report({ lat: 28.6139, lng: 77.2090 }, "Default Location (GPS Unavailable)");
                }
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
