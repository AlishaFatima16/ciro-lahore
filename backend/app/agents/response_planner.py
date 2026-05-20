from typing import Dict, Any, List

class ResponsePlannerAgent:
    """
    Agent 2: Consumes Agent 1's crisis payload to generate a highly prioritized, 
    context-aware urban mitigation strategy.
    """
    
    def generate_plan(self, crisis_data: Dict[str, Any]) -> Dict[str, Any]:
        crisis_type = crisis_data.get("crisis_type", "Unknown")
        severity = crisis_data.get("severity", "LOW")
        affected_zone = crisis_data.get("affected_zone", "Z01")
        
        response_plan = []
        reasoning = ""
        
        if crisis_type == "Urban Flooding":
            response_plan = [
                {
                    "priority": 1,
                    "action": "Traffic Reroute",
                    "department": "Traffic Police",
                    "detail": f"Redirect traffic away from {affected_zone} flooded underpasses."
                },
                {
                    "priority": 2,
                    "action": "Emergency Dispatch",
                    "department": "WASA",
                    "detail": "Dispatch Emergency Drainage Unit to clear water."
                },
                {
                    "priority": 3,
                    "action": "Public Alert",
                    "department": "City Admin",
                    "detail": "Emergency SMS + app push notification."
                },
                {
                    "priority": 4,
                    "action": "Medical Standby",
                    "department": "RESCUE 1122",
                    "detail": "Place units on standby near flooded underpasses."
                }
            ]
            reasoning = "High flooding severity demands parallel dispatch of WASA and RESCUE 1122."
            
        elif crisis_type == "Smog Crisis":
            response_plan = [
                {
                    "priority": 1,
                    "action": "Traffic Restriction",
                    "department": "Traffic Police",
                    "detail": f"Implement speed locks (max 30km/h) in {affected_zone}."
                },
                {
                    "priority": 2,
                    "action": "Public Alert",
                    "department": "Health Department",
                    "detail": "Broadcast Asthma/Health Emergency Warning."
                },
                {
                    "priority": 3,
                    "action": "Emergency Dispatch",
                    "department": "EPA Punjab",
                    "detail": "Deploy Air Scrubbing Trucks."
                }
            ]
            reasoning = "Hazardous smog requires immediate traffic speed limits and EPA intervention."
            
        elif crisis_type == "Road Accident":
            response_plan = [
                {
                    "priority": 1,
                    "action": "Emergency Dispatch",
                    "department": "RESCUE 1122",
                    "detail": "Dispatch ambulance to accident site."
                },
                {
                    "priority": 2,
                    "action": "Traffic Reroute",
                    "department": "Traffic Police",
                    "detail": "Block lane and divert traffic."
                }
            ]
            reasoning = "Accident requires immediate medical response and lane clearance."
            
        return {
            "crisis_summary": f"{crisis_type} in {affected_zone} - {severity}",
            "response_plan": response_plan,
            "reasoning": reasoning
        }
