import json
from datetime import datetime

# Agent Constants
AGENT_NAME = "Agent 1 — Crisis Detector"
PASS_TO = "Agent 2 — Response Planner"

# Dictionary of Keywords mapping to Categories (Roman Urdu + English)
KEYWORDS = {
    "flood": ["pani", "barish", "baarish", "flood", "flooding", "bhar gaya", "doob", "underpass", "waterlogging"],
    "smog": ["smog", "dhund", "fog", "visibility", "aqi", "pollution", "hawa kharab"],
    "accident": ["accident", "crash", "takra", "collision", "road block", "gaari phans", "jam"]
}

# Lahore Zone Mapping
LOCATIONS = {
    "Z01 — Anarkali / Old City": ["mall road", "anarkali"],
    "Z02 — Liberty Chowk / Gulberg / Canal Road": ["liberty", "canal", "gulberg"],
    "Z03 — Model Town / Garden Town": ["model town", "garden town", "kalma"],
    "Z04 — DHA / Cantt": ["dha", "cantt"],
    "Z05 — Ferozpur Road Corridor": ["ferozpur", "thokar"]
}

# Roads mapping per zone
ZONE_ROADS = {
    "Z01 — Anarkali / Old City": ["Mall Road", "Anarkali Road"],
    "Z02 — Liberty Chowk / Gulberg / Canal Road": ["Canal Road", "MM Alam Road", "Liberty Underpass"],
    "Z03 — Model Town / Garden Town": ["Model Town Link Road", "Garden Town Main Boulevard", "Kalma Underpass"],
    "Z04 — DHA / Cantt": ["DHA Main Boulevard", "Walton Road"],
    "Z05 — Ferozpur Road Corridor": ["Ferozpur Road", "Thokar Niaz Baig"],
    "Unknown Zone": []
}

def _parse_keywords(text_signals):
    """Parses text signals to find active keyword categories."""
    active_categories = {"flood": 0, "smog": 0, "accident": 0}
    combined_text = " ".join(text_signals).lower()
    
    for category, words in KEYWORDS.items():
        for word in words:
            if word in combined_text:
                active_categories[category] += combined_text.count(word)
                
    return active_categories

def _map_location(text_signals):
    """Maps social signals to a defined Lahore zone based on keywords."""
    combined_text = " ".join(text_signals).lower()
    
    for zone, keywords in LOCATIONS.items():
        for kw in keywords:
            if kw in combined_text:
                return zone
    return "Unknown Zone"

def _calculate_severity_and_confidence(crisis_type, weather, traffic, signal_count):
    """Calculates dynamic severity and confidence based on data metrics."""
    severity = "Low"
    confidence = 0
    
    # Base confidence purely from social signals (caps at 40%)
    base_confidence = min(signal_count * 20, 40) 
    
    if crisis_type == "Urban Flooding":
        rainfall = weather.get("rainfall_mm", 0)
        congestion = traffic.get("congestion_ratio", 0)
        
        if rainfall > 100:
            severity = "Critical"
        elif rainfall > 75:
            severity = "High"
        else:
            severity = "Moderate"
            
        confidence = base_confidence + 30 * (rainfall > 50) + 30 * (congestion > 0.80)
        
    elif crisis_type == "Smog Crisis":
        aqi = weather.get("aqi", 0)
        visibility = weather.get("visibility_km", 10)
        
        if aqi > 400 or visibility < 0.1:
            severity = "Critical"
        elif aqi > 350 or visibility < 0.3:
            severity = "High"
        else:
            severity = "Moderate"
            
        confidence = base_confidence + 30 * (aqi > 300) + 30 * (visibility < 0.5)
        
    elif crisis_type == "Road Accident":
        congestion = traffic.get("congestion_ratio", 0)
        speed = traffic.get("avg_speed_kmh", 50)
        
        if congestion > 0.95 or speed < 5:
            severity = "Critical"
        elif congestion > 0.85 or speed < 15:
            severity = "High"
        else:
            severity = "Moderate"
            
        # Accidents rely heavily on traffic congestion + social signals
        confidence = base_confidence + 60 * (congestion > 0.75)
        
    else:
        severity = "N/A"
        confidence = 0

    return severity, min(100, int(confidence))

def detect_crisis(input_payload: dict) -> dict:
    """
    Main agent function to detect the crisis type from multimodal payloads.
    Receives social media complaints, weather JSON, and traffic JSON.
    Returns a standardized dictionary.
    """
    # 1. Safe extraction of payload data (handling missing keys/edge cases)
    social_signals = input_payload.get("social_signals", [])
    weather = input_payload.get("weather", {}) or {}
    traffic = input_payload.get("traffic", {}) or {}
    timestamp = input_payload.get("timestamp", datetime.now().isoformat())
    
    # 2. Extract specific metrics safely
    rainfall_mm = weather.get("rainfall_mm", 0)
    aqi = weather.get("aqi", 0)
    visibility_km = weather.get("visibility_km", 10) # default high visibility
    congestion_ratio = traffic.get("congestion_ratio", 0)
    
    # 3. Parse inputs
    active_keywords = _parse_keywords(social_signals)
    affected_zone = _map_location(social_signals)
    signal_count = len(social_signals)
    
    crisis_type = "Unknown"
    explanation = "Insufficient data or no clear pattern matched."
    
    # 4. Rule-based detection logic
    # Rule 1: Urban Flooding if rainfall_mm > 50, congestion_ratio > 0.80, and flood keywords are active.
    is_flood = rainfall_mm > 50 and congestion_ratio > 0.80 and active_keywords["flood"] > 0
    
    # Rule 2: Smog Crisis if (aqi > 300 or visibility_km < 0.5) and smog keywords are active.
    is_smog = (aqi > 300 or visibility_km < 0.5) and active_keywords["smog"] > 0
    
    # Rule 3: Road Accident if accident keywords are active and congestion_ratio > 0.75.
    is_accident = active_keywords["accident"] > 0 and congestion_ratio > 0.75
    
    if is_flood:
        crisis_type = "Urban Flooding"
        explanation = f"Detected flood keywords combined with {rainfall_mm}mm rain and {int(congestion_ratio*100)}% traffic congestion."
    elif is_smog:
        crisis_type = "Smog Crisis"
        explanation = f"Detected smog keywords combined with AQI {aqi} and visibility {visibility_km}km."
    elif is_accident:
        crisis_type = "Road Accident"
        explanation = f"Detected accident keywords combined with {int(congestion_ratio*100)}% traffic congestion."
    elif signal_count > 0:
        explanation = "Social signals detected, but thresholds for weather or traffic conditions were not met."

    # 5. Calculate Severity and Confidence
    severity, confidence = _calculate_severity_and_confidence(crisis_type, weather, traffic, signal_count)
    
    # 6. Format and return output
    return {
        "agent": AGENT_NAME,
        "crisis_type": crisis_type,
        "affected_zone": affected_zone,
        "severity": severity,
        "confidence": confidence,
        "signal_count": signal_count,
        "explanation": explanation,
        "affected_roads": ZONE_ROADS.get(affected_zone, []),
        "timestamp": timestamp,
        "passed_to": PASS_TO
    }

# ==========================================
# TEST CASES
# ==========================================
if __name__ == "__main__":
    
    print(f"--- Running Tests for {AGENT_NAME} ---\n")

    # 1. Liberty flooding
    test_1 = {
        "social_signals": ["Liberty Chowk pe pani bhar gaya, traffic ruki hui hai", "underpass is flooded at liberty"],
        "weather": {"rainfall_mm": 94, "aqi": 180, "visibility_km": 2.5},
        "traffic": {"congestion_ratio": 0.94, "avg_speed_kmh": 3},
        "timestamp": "2026-07-18T08:24:00"
    }
    print("Test 1: Liberty Flooding")
    print(json.dumps(detect_crisis(test_1), indent=2))
    print("-" * 50)

    # 2. DHA smog
    test_2 = {
        "social_signals": ["DHA phase 6 main boht smog hai", "visibility is zero hawa kharab hai DHA main"],
        "weather": {"rainfall_mm": 0, "aqi": 350, "visibility_km": 0.3},
        "traffic": {"congestion_ratio": 0.40, "avg_speed_kmh": 40},
        "timestamp": "2026-11-12T07:30:00"
    }
    print("Test 2: DHA Smog")
    print(json.dumps(detect_crisis(test_2), indent=2))
    print("-" * 50)

    # 3. Mall Road accident
    test_3 = {
        "social_signals": ["Huge crash on Mall Road, total road block"],
        "weather": {"rainfall_mm": 0, "aqi": 150, "visibility_km": 5.0},
        "traffic": {"congestion_ratio": 0.85, "avg_speed_kmh": 10},
        "timestamp": "2026-05-18T14:15:00"
    }
    print("Test 3: Mall Road Accident")
    print(json.dumps(detect_crisis(test_3), indent=2))
    print("-" * 50)

    # 4. Vague Liberty input (Social signals exist but thresholds not met)
    test_4 = {
        "social_signals": ["Liberty main boht rush hai"],
        "weather": {"rainfall_mm": 10, "aqi": 100, "visibility_km": 8.0},
        "traffic": {"congestion_ratio": 0.50, "avg_speed_kmh": 25},
        "timestamp": "2026-06-01T17:00:00"
    }
    print("Test 4: Vague Liberty Input")
    print(json.dumps(detect_crisis(test_4), indent=2))
    print("-" * 50)

    # 5. Empty input (Missing signals, missing weather, missing traffic)
    test_5 = {}
    print("Test 5: Empty Input")
    print(json.dumps(detect_crisis(test_5), indent=2))
    print("-" * 50)

    # 6. Liberty flooding returning affected roads
    test_6 = {
        "social_signals": ["Liberty underpass is completely submerged, canal is overflowing"],
        "weather": {"rainfall_mm": 110, "aqi": 120, "visibility_km": 4.0},
        "traffic": {"congestion_ratio": 0.98, "avg_speed_kmh": 1},
        "timestamp": "2026-08-20T09:15:00"
    }
    print("Test 6: Liberty Flooding (Affected Roads)")
    print(json.dumps(detect_crisis(test_6), indent=2))
    print("-" * 50)
