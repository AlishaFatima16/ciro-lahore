from typing import Dict, Any, List
import uuid

class ActionExecutorAgent:
    """
    Agent 3: Simulates execution changes for each action item,
    records timestamped execution logs, and simulates state transitions.
    """
    
    def simulate_execution(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        plan = response_data.get("response_plan", [])
        
        simulated_executions = []
        tickets = []
        
        for action in plan:
            action_type = action.get("action")
            dept = action.get("department")
            priority_str = f"P{action.get('priority')}"
            
            # Generate fake ticket
            prefix = "LHR"
            if dept == "WASA": prefix = "WASA"
            elif dept == "RESCUE 1122": prefix = "RESCUE"
            elif dept == "Traffic Police": prefix = "TP"
            elif dept == "EPA Punjab": prefix = "EPA"
            
            ticket_id = f"{prefix}-{str(uuid.uuid4())[:8].upper()}"
            
            tickets.append({
                "id": ticket_id,
                "type": action_type,
                "priority": priority_str,
                "status": "ACTIVE" if "Alert" not in action_type else "SENT"
            })
            
            simulated_executions.append({
                "type": action_type,
                "status": "EXECUTED" if action_type == "Traffic Reroute" else ("SENT" if "Alert" in action_type else "DISPATCHED"),
                "detail": action.get("detail")
            })

        # Calculate mock congestion drop
        crisis_summary = response_data.get("crisis_summary", "")
        if "Flooding" in crisis_summary:
            before = {"congestion": "94%", "avgSpeed": "3 km/h", "alertsSent": 0, "systemStatus": "CRISIS_UNMANAGED"}
            after = {"congestion": "38%", "avgSpeed": "18 km/h", "alertsSent": 45200, "systemStatus": "CRISIS_MANAGED"}
        elif "Smog" in crisis_summary:
            before = {"congestion": "84%", "avgSpeed": "12 km/h", "alertsSent": 0, "systemStatus": "CRISIS_UNMANAGED"}
            after = {"congestion": "45%", "avgSpeed": "28 km/h", "alertsSent": 12000, "systemStatus": "CRISIS_MANAGED"}
        else:
            before = {"congestion": "70%", "avgSpeed": "15 km/h", "alertsSent": 0, "systemStatus": "CRISIS_UNMANAGED"}
            after = {"congestion": "40%", "avgSpeed": "25 km/h", "alertsSent": 500, "systemStatus": "CRISIS_MANAGED"}
            
        return {
            "executed": True,
            "before": before,
            "after": after,
            "summary": {
                "actionsExecuted": len(simulated_executions),
                "ticketsGenerated": len(tickets)
            },
            "actions": simulated_executions,
            "tickets": tickets
        }
