from typing import Dict, Any, Tuple

class CrisisDetectorAgent:
    """
    Agent 1: Fuses disparate telemetry, parses informal public strings, 
    evaluates severity, and calculates a percentage-based confidence level.
    """
    
    def parse_roman_urdu(self, text: str) -> Dict[str, Any]:
        """Tool: RomanUrdu_Parser"""
        text_lower = text.lower()
        
        # Keywords
        flood_keywords = ["pani", "bhar gaya", "flood", "selab", "barish", "rain", "underpass"]
        smog_keywords = ["smog", "dhund", "visibility", "breathing", "cough", "saans", "aqi"]
        accident_keywords = ["accident", "collision", "pileup", "phans", "blocked", "traffic"]
        
        # Zone matching (simple)
        zones = {
            "Z01": ["anarkali", "mall road", "lohari"],
            "Z02": ["liberty", "gulberg", "canal", "mm alam"],
            "Z03": ["model town", "garden town", "kalma", "jail road"],
            "Z04": ["dha", "cantt", "shahrah-e-faisal"],
            "Z05": ["ferozpur", "thokar"]
        }
        
        flags = {
            "flood_active": any(k in text_lower for k in flood_keywords),
            "smog_active": any(k in text_lower for k in smog_keywords),
            "accident_active": any(k in text_lower for k in accident_keywords),
            "zones_detected": []
        }
        
        for zone_id, kw_list in zones.items():
            if any(k in text_lower for k in kw_list):
                flags["zones_detected"].append(zone_id)
                
        return flags

    def evaluate(self, signals: Dict[str, Any]) -> Dict[str, Any]:
        text_flags = self.parse_roman_urdu(signals.get("signal", ""))
        
        rainfall_mm = signals.get("rainfall_mm", 0)
        aqi = signals.get("aqi", 0)
        visibility_km = signals.get("visibility_km", 10.0)
        congestion_ratio = signals.get("congestion_ratio", 0.0)
        
        crisis_type = "Unknown"
        severity = "LOW"
        confidence = 0.0
        affected_zone = text_flags["zones_detected"][0] if text_flags["zones_detected"] else "Z01"
        
        # Evaluate Urban Flooding
        # Triggered if rainfall_mm > 50, congestion_ratio > 0.80, and flooding keywords are active.
        if (rainfall_mm > 50 and congestion_ratio > 0.80) or text_flags["flood_active"] or signals.get("floodRisk", False):
            crisis_type = "Urban Flooding"
            if rainfall_mm > 50 and congestion_ratio > 0.80:
                confidence = 94.0
                severity = "HIGH"
            else:
                confidence = 75.0
                severity = "MEDIUM"

        # Evaluate Smog Crisis
        # Triggered if aqi > 300 or visibility_km < 0.5 alongside smog keywords.
        elif (aqi > 300 or visibility_km < 0.5) or text_flags["smog_active"] or signals.get("smokeDetected", False):
            crisis_type = "Smog Crisis"
            if aqi > 300 or visibility_km < 0.5:
                confidence = 96.0
                severity = "CRITICAL"
            else:
                confidence = 80.0
                severity = "HIGH"
                
        # Evaluate Road Accident
        # Triggered if accident keywords are detected and congestion_ratio > 0.75.
        elif text_flags["accident_active"] and congestion_ratio > 0.75:
            crisis_type = "Road Accident"
            confidence = 85.0
            severity = "HIGH"
            
        return {
            "crisis_type": crisis_type,
            "severity": severity,
            "confidence": confidence,
            "affected_zone": affected_zone,
            "affected_roads": "Calculated based on zone",
            "signal_flags": text_flags
        }
