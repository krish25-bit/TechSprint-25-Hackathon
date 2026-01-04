import { IncidentPriority, IncidentType } from "@/context/EmergencyContext";

interface AIAnalysisResult {
    type: IncidentType;
    priority: IncidentPriority;
    peopleAffected: number;
    description: string;
    locationEstimate?: string;
}

export function analyzeEmergencyInput(text: string): AIAnalysisResult {
    const input = text.toLowerCase();
    let type: IncidentType = 'Other';
    let priority: IncidentPriority = 'LOW';
    let peopleAffected = 0;

    // Detect Priority
    if (input.includes('critical') || input.includes('severe') || input.includes('dying') || input.includes('trapped')) {
        priority = 'CRITICAL';
    } else if (input.includes('urgent') || input.includes('fast') || input.includes('immediately')) {
        priority = 'HIGH';
    }
    // Default remains LOW unless upgraded

    // Detect Type
    if (input.includes('fire') || input.includes('burn') || input.includes('smoke')) type = 'Fire';
    else if (input.includes('flood') || input.includes('water') || input.includes('drowning')) type = 'Flood';
    else if (input.includes('quake') || input.includes('shaking')) type = 'Earthquake';
    else if (input.includes('injury') || input.includes('blood') || input.includes('hurt') || input.includes('ambulance')) type = 'Medical';
    else if (input.includes('cyclone') || input.includes('wind') || input.includes('storm')) type = 'Cyclone';
    else if (input.includes('help') || input.includes('sos') || input.includes('emergency')) type = 'General SOS';

    // Detect Priority
    if (input.includes('critical') || input.includes('severe') || input.includes('dying') || input.includes('trapped') || input.includes('help') || input.includes('sos')) {
        priority = 'CRITICAL';
    } else if (input.includes('urgent') || input.includes('fast') || input.includes('immediately')) {
        priority = 'HIGH';
    }
    const numberMatch = input.match(/(\d+)\s+(people|persons|victims|casualties)/);
    if (numberMatch) {
        peopleAffected = parseInt(numberMatch[1]);
    }

    // Fallback if priority is LOW but people > 0 -> HIGH
    if (peopleAffected > 0 && priority === 'LOW') priority = 'HIGH';

    // Detect Location
    let locationEstimate = "GPS Location Preferred";
    const locationMatch = input.match(/(?:at|near|in)\s+([a-zA-Z0-9\s]+?)(?:$|\.|,|\s+(?:is|has|with|needs))/i);
    if (locationMatch && locationMatch[1].trim().length > 3) {
        locationEstimate = locationMatch[1].trim();
        // Remove common stopwords if accidentally captured
        locationEstimate = locationEstimate.replace(/^(the|a|an)\s+/i, '');
    }

    return {
        type,
        priority,
        peopleAffected,
        description: text,
        locationEstimate
    };
}
