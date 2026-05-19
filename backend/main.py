from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import os

app = FastAPI(title="CIRO - Crisis Intelligence & Response Orchestrator API", version="1.0.0")

# Enable CORS for React Native Web & Native clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active Crisis State (defaults to FLOOD)
current_scenario = "FLOOD"
custom_signal_text = ""
custom_toggles = {
    "floodRisk": True,
    "smokeDetected": False,
    "powerOutage": False
}

# ── HELPER: Load JSON files relative to script ─────────────────
def load_mock_json(filename: str) -> Dict[str, Any]:
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(script_dir, "../mobile-app/ciro-mob/src/actual-mock-data", filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading mock JSON {filename}: {e}")
    return {}

# Embedded Fallback Data for maximum reliability
FALLBACK_TRACES = {
    "FLOOD": [
        { "id": 1, "timestamp": "10:02:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_START", "message": "🚀 Antigravity Orchestrator initialized for FLOOD_RESPONSE in Lahore.", "state": "SUCCESS" },
        { "id": 2, "timestamp": "10:02:10", "agent": "Signal Detection Agent", "level": "info", "type": "SIGNAL_NORMALIZATION", "message": "🔍 Initializing social and sensory signal ingestion scan...", "state": "RUNNING" },
        { "id": 3, "timestamp": "10:02:25", "agent": "Signal Detection Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: GrepSearch({ query: ['water', 'flood', 'underpass', 'canal'] })", "tool": { "name": "GrepSearch", "input": "query: ['water', 'flood', 'underpass', 'canal']", "output": "Found 13 matches in Gulberg Social Feed" }, "state": "RUNNING" },
        { "id": 4, "timestamp": "10:02:40", "agent": "Signal Detection Agent", "level": "success", "type": "SIGNAL_MATCH", "message": "📝 Tool returned 13 social signals. Flood-related Roman Urdu keywords detected in Gulberg sector.", "state": "SUCCESS" },
        { "id": 5, "timestamp": "10:03:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Signal normalized. Orchestrator transitioning control to Weather Correlation Agent.", "state": "SUCCESS" },
        { "id": 6, "timestamp": "10:03:15", "agent": "Weather Correlation Agent", "level": "info", "type": "SENSOR_INQUIRY", "message": "🌧️ Retrieving PMD precipitation readings & WASA drain telemetry...", "state": "RUNNING" },
        { "id": 7, "timestamp": "10:03:30", "agent": "Weather Correlation Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: ReadSensorData({ sensor_id: 'LHR-PMD-04' })", "tool": { "name": "ReadSensorData", "input": "sensor_id: 'LHR-PMD-04' (Gulberg Station)", "output": "Precipitation: 94mm, Drain Capacity: 55%" }, "state": "RUNNING" },
        { "id": 8, "timestamp": "10:03:45", "agent": "Weather Correlation Agent", "level": "critical", "type": "THRESHOLD_BREACH", "message": "🚨 Heavy rainfall confirmed. PMD reports 94mm cloudburst. WASA drainage absorption threshold exceeded.", "state": "CRITICAL" },
        { "id": 9, "timestamp": "10:04:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Severity verified. Orchestrator transitioning control to Traffic Analysis Agent.", "state": "SUCCESS" },
        { "id": 10, "timestamp": "10:04:15", "agent": "Traffic Analysis Agent", "level": "info", "type": "CONGESTION_SCAN", "message": "🚗 Scanning Lahore Traffic Engineering Bureau sensor nodes...", "state": "RUNNING" },
        { "id": 11, "timestamp": "10:04:30", "agent": "Traffic Analysis Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: FetchCongestionMetrics({ sector: 'Gulberg / Liberty' })", "tool": { "name": "FetchCongestionMetrics", "input": "sector: 'Gulberg / Liberty'", "output": "Congestion Index: 0.94, Avg Speed: 3km/h, Stalled Vehicles: 12" }, "state": "RUNNING" },
        { "id": 12, "timestamp": "10:04:45", "agent": "Traffic Analysis Agent", "level": "critical", "type": "ANOMALY_CONFIRM", "message": "🚨 Congestion spike detected near Mall Road & Liberty Underpass. Gridlock active. 12 vehicles stalled in water.", "state": "CRITICAL" },
        { "id": 13, "timestamp": "10:05:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Crisis parameters verified. Orchestrator transitioning control to Response Planning Agent.", "state": "SUCCESS" },
        { "id": 14, "timestamp": "10:05:15", "agent": "Response Planning Agent", "level": "info", "type": "ROUTE_GENERATION", "message": "🔀 Generating alternate bypass paths and signal priority vectors...", "state": "RUNNING" },
        { "id": 15, "timestamp": "10:05:30", "agent": "Response Planning Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: GenerateAlternateRoutes({ origin: 'Gulberg', destination: 'Jail Road' })", "tool": { "name": "GenerateAlternateRoutes", "input": "origin: 'Gulberg', destination: 'Jail Road'", "output": "Bypass: Jail Road → Kalma Chowk, Travel Time: 12m" }, "state": "RUNNING" },
        { "id": 16, "timestamp": "10:05:45", "agent": "Response Planning Agent", "level": "success", "type": "ROUTE_CONFIRM", "message": "✅ Alternate routing generated: Redirect Jail Road bypass to Kalma Chowk. Projections estimate 56% congestion drop.", "state": "SUCCESS" },
        { "id": 17, "timestamp": "10:06:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Route finalized. Orchestrator transitioning control to Emergency Dispatch Agent.", "state": "SUCCESS" },
        { "id": 18, "timestamp": "10:06:15", "agent": "Emergency Dispatch Agent", "level": "info", "type": "DISPATCH_COORDINATION", "message": "📢 Establishing emergency sockets with public response agencies...", "state": "RUNNING" },
        { "id": 19, "timestamp": "10:06:30", "agent": "Emergency Dispatch Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: SendDispatchNotification({ agencies: ['WASA', 'Rescue 1122'], urgency: 'P1' })", "tool": { "name": "SendDispatchNotification", "input": "agencies: ['WASA', 'Rescue 1122'], urgency: 'P1'", "output": "WASA Pump Units: 4, Ambulances: 3, Status: Dispatched" }, "state": "RUNNING" },
        { "id": 20, "timestamp": "10:06:45", "agent": "Emergency Dispatch Agent", "level": "success", "type": "DISPATCH_COMPLETE", "message": "🚨 WASA and Rescue 1122 notified. 4 WASA pumps & 3 ambulances deployed on-site.", "state": "SUCCESS" },
        { "id": 21, "timestamp": "10:07:00", "agent": "ORCHESTRATOR", "level": "success", "type": "WORKFLOW_COMPLETE", "message": "✅ Swarm orchestration concluded successfully. 5 agents executed 5 tools. Lahore Crisis state managed.", "state": "SUCCESS" }
    ],
    "SMOG": [
        { "id": 1, "timestamp": "07:00:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_START", "message": "🚀 Antigravity Orchestrator initialized for SMOG_EMERGENCY in Lahore.", "state": "SUCCESS" },
        { "id": 2, "timestamp": "07:00:10", "agent": "Signal Detection Agent", "level": "info", "type": "SIGNAL_NORMALIZATION", "message": "🔍 Initializing social complaint and environmental sensor scan...", "state": "RUNNING" },
        { "id": 3, "timestamp": "07:00:25", "agent": "Signal Detection Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: GrepSearch({ query: ['smog', 'visibility', 'breathing', 'cough'] })", "tool": { "name": "GrepSearch", "input": "query: ['smog', 'visibility', 'breathing', 'cough']", "output": "Found 12 matches in DHA Social Feed" }, "state": "RUNNING" },
        { "id": 4, "timestamp": "07:00:40", "agent": "Signal Detection Agent", "level": "success", "type": "SIGNAL_MATCH", "message": "📝 Tool returned 12 social reports. Smog-related health complaints and low visibility confirmed in DHA sector.", "state": "SUCCESS" },
        { "id": 5, "timestamp": "07:01:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Signal verified. Orchestrator transitioning control to Weather Correlation Agent.", "state": "SUCCESS" },
        { "id": 6, "timestamp": "07:01:15", "agent": "Weather Correlation Agent", "level": "info", "type": "SENSOR_INQUIRY", "message": "🌫️ Retrieving environmental particulate indexes & MET visibility arrays...", "state": "RUNNING" },
        { "id": 7, "timestamp": "07:01:30", "agent": "Weather Correlation Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: ReadSensorData({ sensor_id: 'LHR-EPA-DHA' })", "tool": { "name": "ReadSensorData", "input": "sensor_id: 'LHR-EPA-DHA' (DHA Phase 4)", "output": "AQI: 387, PM2.5: 312ug, Visibility: 0.3km" }, "state": "RUNNING" },
        { "id": 8, "timestamp": "07:01:45", "agent": "Weather Correlation Agent", "level": "critical", "type": "THRESHOLD_BREACH", "message": "🚨 Heavy smog confirmed. AQI 387 (HAZARDOUS). PM2.5 is 20x WHO safe limit.", "state": "CRITICAL" },
        { "id": 9, "timestamp": "07:02:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Environmental hazard verified. Orchestrator transitioning control to Traffic Analysis Agent.", "state": "SUCCESS" },
        { "id": 10, "timestamp": "07:02:15", "agent": "Traffic Analysis Agent", "level": "info", "type": "CONGESTION_SCAN", "message": "🚗 Scanning Ferozpur Road & DHA Main Blvd speed telemetry...", "state": "RUNNING" },
        { "id": 11, "timestamp": "07:02:30", "agent": "Traffic Analysis Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: FetchCongestionMetrics({ sector: 'Ferozpur / Cantt' })", "tool": { "name": "FetchCongestionMetrics", "input": "sector: 'Ferozpur / Cantt'", "output": "Congestion Index: 0.84, Avg Speed: 12km/h, Collisions: 1" }, "state": "RUNNING" },
        { "id": 12, "timestamp": "07:02:45", "agent": "Traffic Analysis Agent", "level": "critical", "type": "ANOMALY_CONFIRM", "message": "🚨 Multi-vehicle collision pile-up detected near toll plaza due to zero visibility (0.3km). Ferozpur road partially blocked.", "state": "CRITICAL" },
        { "id": 13, "timestamp": "07:03:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Crisis parameters verified. Orchestrator transitioning control to Response Planning Agent.", "state": "SUCCESS" },
        { "id": 14, "timestamp": "07:03:15", "agent": "Response Planning Agent", "level": "info", "type": "ROUTE_GENERATION", "message": "🔀 Generating smart diversion corridors and speed lock protocols...", "state": "RUNNING" },
        { "id": 15, "timestamp": "07:03:30", "agent": "Response Planning Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: GenerateAlternateRoutes({ target_sector: 'DHA Corridor' })", "tool": { "name": "GenerateAlternateRoutes", "input": "target_sector: 'DHA Corridor'", "output": "Diverted Route: Ring Road bypass, Speed lock: 30km/h max" }, "state": "RUNNING" },
        { "id": 16, "timestamp": "07:03:45", "agent": "Response Planning Agent", "level": "success", "type": "ROUTE_CONFIRM", "message": "✅ Alternate routing and restrictions activated. Diverted traffic to Ring Road. Speed advisories (max 30 km/h) active.", "state": "SUCCESS" },
        { "id": 17, "timestamp": "07:04:00", "agent": "ORCHESTRATOR", "level": "info", "type": "WORKFLOW_TRANSITION", "message": "🔀 Directives confirmed. Orchestrator transitioning control to Emergency Dispatch Agent.", "state": "SUCCESS" },
        { "id": 18, "timestamp": "07:04:15", "agent": "Emergency Dispatch Agent", "level": "info", "type": "DISPATCH_COORDINATION", "message": "📢 Coordinating with EPA response crew and medical command units...", "state": "RUNNING" },
        { "id": 19, "timestamp": "07:04:30", "agent": "Emergency Dispatch Agent", "level": "system", "type": "TOOL_INVOKE", "message": "⚙️ Invoking Tool: SendDispatchNotification({ agencies: ['Rescue 1122', 'EPA_Scrubbers'], urgency: 'P1' })", "tool": { "name": "SendDispatchNotification", "input": "agencies: ['Rescue 1122', 'EPA_Scrubbers'], urgency: 'P1'", "output": "EPA Air Scrubbers: 2, Rescue units: 2, Status: Deployed" }, "state": "RUNNING" },
        { "id": 20, "timestamp": "07:04:45", "agent": "Emergency Dispatch Agent", "level": "success", "type": "DISPATCH_COMPLETE", "message": "🚨 EPA and Rescue 1122 notified. 2 EPA Air scrubber trucks & Rescue teams dispatched on-site.", "state": "SUCCESS" },
        { "id": 21, "timestamp": "07:05:00", "agent": "ORCHESTRATOR", "level": "success", "type": "WORKFLOW_COMPLETE", "message": "✅ Swarm orchestration concluded successfully. 5 agents executed 5 tools. Lahore air emergency state controlled.", "state": "SUCCESS" }
    ]
}

# ── REQUEST MODELS ───────────────────────────────────────────
class SignalIngest(BaseModel):
    signal: str
    floodRisk: bool
    smokeDetected: bool
    powerOutage: bool

# ── ENDPOINTS ────────────────────────────────────────────────

@app.post("/signals/ingest")
def post_signals_ingest(payload: SignalIngest):
    global current_scenario, custom_signal_text, custom_toggles
    custom_signal_text = payload.signal
    custom_toggles = {
        "floodRisk": payload.floodRisk,
        "smokeDetected": payload.smokeDetected,
        "powerOutage": payload.powerOutage
    }
    
    # Simple classification keywords logic
    text = payload.signal.lower()
    if "smog" in text or "visibility" in text or "aqi" in text or "accident" in text or "dha" in text or "ferozpur" in text or payload.smokeDetected:
        current_scenario = "SMOG"
    else:
        current_scenario = "FLOOD"
        
    return {
        "status": "SUCCESS",
        "matched_scenario": current_scenario,
        "detail": f"Swarm initialized for {current_scenario} scenario response plan."
    }

@app.get("/crisis/current")
def get_crisis_current():
    # Returns dynamic weather/traffic metrics
    is_flood = current_scenario == "FLOOD"
    
    return {
        "detected": True,
        "type": "Urban Flooding" if is_flood else "Smog Crisis",
        "subtype": "Monsoon Cloudburst & Drain Overflow" if is_flood else "Hazardous PM2.5 Inversion",
        "severity": "CRITICAL",
        "confidence": 94 if is_flood else 96,
        "location": "Liberty Chowk / Gulberg, Lahore" if is_flood else "DHA / Ferozpur Road, Lahore",
        "affectedArea": "3.5 km radius" if is_flood else "10 km radius",
        "estimatedAffected": "140,000+ residents" if is_flood else "340,000+ residents",
        "weather": {
            "condition": "Extreme monsoon cloudburst" if is_flood else "Hazardous Smog Blanket",
            "rainfall": "94 mm (3.5 hours)" if is_flood else "0 mm (PM2.5: 312 ug)",
            "windSpeed": "22 km/h" if is_flood else "3 km/h",
            "forecast": "Flash flood warning in Gulberg zones" if is_flood else "AQI 387. Visibility below 300m."
        },
        "traffic": {
            "congestionLevel": "94%" if is_flood else "84%",
            "avgSpeed": "3 km/h" if is_flood else "14 km/h",
            "vehiclesStranded": 847 if is_flood else 5
        }
    }

@app.get("/agents/traces")
def get_agents_traces():
    # Returns the log traces database for current scenario
    return {
        "status": "SUCCESS",
        "scenario": current_scenario,
        "logs": FALLBACK_TRACES.get(current_scenario, [])
    }

@app.get("/simulation/status")
def get_simulation_status():
    is_flood = current_scenario == "FLOOD"
    if is_flood:
        return {
            "executed": True,
            "before": { "congestion": "94%", "avgSpeed": "3 km/h", "alertsSent": 0, "vehiclesStranded": 12, "systemStatus": "CRISIS_UNMANAGED" },
            "after": { "congestion": "38%", "avgSpeed": "18 km/h", "alertsSent": 3, "vehiclesStranded": 0, "systemStatus": "CRISIS_MANAGED" },
            "summary": { "congestionReduced": "56%", "vehiclesCleared": 12, "alertsSent": 3, "ticketsGenerated": 6, "actionsExecuted": 8, "estimatedLivesProtected": 120 },
            "actions": [
                { "type": "ROAD_CLOSURE", "status": "EXECUTED", "detail": "Canal Road (Submerged)" },
                { "type": "ROAD_CLOSURE", "status": "EXECUTED", "detail": "Liberty Underpass (Stranded Cars)" },
                { "type": "ROUTE_ACTIVATE", "status": "EXECUTED", "detail": "Jail Road → Kalma Chowk Diversion" },
                { "type": "EMERGENCY_DISPATCH", "status": "DISPATCHED", "detail": "4 WASA Drainage Pump Units" },
                { "type": "EMERGENCY_DISPATCH", "status": "DISPATCHED", "detail": "3 Rescue 1122 Ambulances" },
                { "type": "ALERT_SENT", "status": "SENT", "detail": "SMS Flood Alert to Gulberg Residents" },
                { "type": "ALERT_SENT", "status": "SENT", "detail": "Waze/Google Maps traffic hazard marker" },
                { "type": "SIGNAL_OVERRIDE", "status": "EXECUTED", "detail": "Gulberg Main Blvd emergency signal green extension" }
            ],
            "tickets": [
                { "id": "RC-FL001", "type": "ROAD_CLOSURE", "priority": "P1", "status": "RESOLVED" },
                { "id": "ED-FL002", "type": "DRAINAGE_PUMP", "priority": "P1", "status": "ACTIVE" },
                { "id": "ED-FL003", "type": "RESCUE_1122", "priority": "P1", "status": "ACTIVE" },
                { "id": "AL-FL004", "type": "SMS_BROADCAST", "priority": "P2", "status": "SENT" },
                { "id": "AL-FL005", "type": "NAV_ALERT", "priority": "P3", "status": "SENT" },
                { "id": "SO-FL006", "type": "TRAFFIC_SIGNAL", "priority": "P2", "status": "ACTIVE" }
            ]
        }
    else:
        return {
            "executed": True,
            "before": { "congestion": "84%", "avgSpeed": "12 km/h", "alertsSent": 0, "vehiclesStranded": 5, "systemStatus": "CRISIS_UNMANAGED" },
            "after": { "congestion": "45%", "avgSpeed": "28 km/h", "alertsSent": 4, "vehiclesStranded": 1, "systemStatus": "CRISIS_MANAGED" },
            "summary": { "congestionReduced": "39%", "vehiclesCleared": 4, "alertsSent": 4, "ticketsGenerated": 5, "actionsExecuted": 6, "estimatedLivesProtected": 450 },
            "actions": [
                { "type": "ROUTE_ACTIVATE", "status": "EXECUTED", "detail": "Reduced Speed advisory (max 30km/h) DHA Main Boulevard" },
                { "type": "ROAD_CLOSURE", "status": "EXECUTED", "detail": "Ferozpur Toll Plaza Section (Partially Blocked by collision)" },
                { "type": "EMERGENCY_DISPATCH", "status": "DISPATCHED", "detail": "Rescue 1122 Smog Response Units" },
                { "type": "EMERGENCY_DISPATCH", "status": "DISPATCHED", "detail": "EPA Air Scrubbing Trucks to DHA" },
                { "type": "ALERT_SENT", "status": "SENT", "detail": "Asthma/Health Emergency Warning Broadcast" },
                { "type": "ALERT_SENT", "status": "SENT", "detail": "Visibility Advisory to Motorway Police" }
            ],
            "tickets": [
                { "id": "ED-SM001", "type": "RESCUE_1122", "priority": "P1", "status": "ACTIVE" },
                { "id": "ED-SM002", "type": "AIR_SCRUBBER", "priority": "P2", "status": "ACTIVE" },
                { "id": "AL-SM003", "type": "PUBLIC_ADVISORY", "priority": "P1", "status": "SENT" },
                { "id": "AL-SM004", "type": "NAV_ALERT", "priority": "P2", "status": "SENT" },
                { "id": "RC-SM005", "type": "TRAFFIC_DIV", "priority": "P2", "status": "ACTIVE" }
            ]
        }

@app.get("/map/zones")
def get_map_zones():
    is_flood = current_scenario == "FLOOD"
    if is_flood:
        return {
            "center": { "latitude": 31.5126, "longitude": 74.3533 },
            "blockedRoutes": [
                { "id": "FBR-1", "name": "Liberty Underpass Submerged", "coordinates": [{ "latitude": 31.5108, "longitude": 74.3512 }, { "latitude": 31.5135, "longitude": 74.3530 }], "severity": "CRITICAL", "color": "#FF3B30" },
                { "id": "FBR-2", "name": "Canal Road Overflowing", "coordinates": [{ "latitude": 31.5200, "longitude": 74.3550 }, { "latitude": 31.5250, "longitude": 74.3620 }], "severity": "CRITICAL", "color": "#FF3B30" },
                { "id": "FBR-3", "name": "MM Alam Road Gridlock", "coordinates": [{ "latitude": 31.5150, "longitude": 74.3460 }, { "latitude": 31.5180, "longitude": 74.3500 }], "severity": "HIGH", "color": "#FF9500" }
            ],
            "alternateRoutes": [
                { "id": "FAR-1", "name": "Jail Road Bypass", "coordinates": [{ "latitude": 31.5310, "longitude": 74.3460 }, { "latitude": 31.5280, "longitude": 74.3380 }, { "latitude": 31.5220, "longitude": 74.3320 }], "status": "ACTIVE", "color": "#34C759" },
                { "id": "FAR-2", "name": "Kalma Chowk Diversion", "coordinates": [{ "latitude": 31.5030, "longitude": 74.3330 }, { "latitude": 31.5010, "longitude": 74.3450 }, { "latitude": 31.5000, "longitude": 74.3500 }], "status": "ACTIVE", "color": "#30D158" }
            ],
            "emergencyMarkers": [
                { "id": "FEM-1", "type": "FLOOD", "title": "Liberty Chowk Flooding", "coordinate": { "latitude": 31.5126, "longitude": 74.3533 }, "icon": "🌊", "severity": "CRITICAL", "statusBefore": "IMPASSABLE", "statusAfter": "CLEARING" },
                { "id": "FEM-2", "type": "ROAD_CLOSURE", "title": "Liberty Underpass CLOSED", "coordinate": { "latitude": 31.5108, "longitude": 74.3512 }, "icon": "🚧", "severity": "CRITICAL", "statusBefore": "CLOSED (12 stranded)", "statusAfter": "RESOLVED (0 stranded)" },
                { "id": "FEM-3", "type": "ROAD_CLOSURE", "title": "Canal Road Overflow", "coordinate": { "latitude": 31.5220, "longitude": 74.3580 }, "icon": "🌊", "severity": "CRITICAL", "statusBefore": "CLOSED (Submerged)", "statusAfter": "PARTIALLY OPEN" },
                { "id": "FEM-4", "type": "TRAFFIC", "title": "MM Alam Road Gridlock", "coordinate": { "latitude": 31.5160, "longitude": 74.3485 }, "icon": "🚗", "severity": "HIGH", "statusBefore": "CONGESTED (3km/h)", "statusAfter": "FLOWING (18km/h)" },
                { "id": "FEM-5", "type": "REROUTE", "title": "Jail Road Reroute", "coordinate": { "latitude": 31.5310, "longitude": 74.3460 }, "icon": "🔀", "severity": "MODERATE", "statusBefore": "GRIDLOCK", "statusAfter": "RECOMMENDED (Green)" },
                { "id": "FEM-6", "type": "RESCUE", "title": "WASA Pump Dispatch", "coordinate": { "latitude": 31.4705, "longitude": 74.2405 }, "icon": "🚒", "severity": "LOW", "statusBefore": "PENDING", "statusAfter": "ON_SITE (4 pumps)" },
                { "id": "FEM-7", "type": "RESCUE", "title": "Rescue 1122 Medical", "coordinate": { "latitude": 31.5100, "longitude": 74.3450 }, "icon": "🚑", "severity": "LOW", "statusBefore": "EN_ROUTE", "statusAfter": "ON_SITE (Active)" },
                { "id": "FEM-8", "type": "TRAFFIC", "title": "Kalma Chowk Signal Override", "coordinate": { "latitude": 31.5030, "longitude": 74.3330 }, "icon": "🚦", "severity": "LOW", "statusBefore": "NORMAL_TIMER", "statusAfter": "90s GREEN EXTENSION" }
            ]
        }
    else:
        return {
            "center": { "latitude": 31.4697, "longitude": 74.3750 },
            "blockedRoutes": [
                { "id": "SBR-1", "name": "Ferozpur Road Pileup Section", "coordinates": [{ "latitude": 31.4650, "longitude": 74.2880 }, { "latitude": 31.4600, "longitude": 74.2800 }], "severity": "CRITICAL", "color": "#FF3B30" },
                { "id": "SBR-2", "name": "Shahrah-e-Faisal DHA Corridor", "coordinates": [{ "latitude": 31.4780, "longitude": 74.3850 }, { "latitude": 31.4730, "longitude": 74.3720 }], "severity": "HIGH", "color": "#FF9500" }
            ],
            "alternateRoutes": [
                { "id": "SAR-1", "name": "Ring Road Lahore Divert", "coordinates": [{ "latitude": 31.4800, "longitude": 74.4050 }, { "latitude": 31.4900, "longitude": 74.4150 }], "status": "ACTIVE", "color": "#34C759" },
                { "id": "SAR-2", "name": "Walton Road Bypass", "coordinates": [{ "latitude": 31.4880, "longitude": 74.3600 }, { "latitude": 31.4820, "longitude": 74.3500 }], "status": "ACTIVE", "color": "#30D158" }
            ],
            "emergencyMarkers": [
                { "id": "SEM-1", "type": "SMOG", "title": "DHA Y-Block (AQI 387)", "coordinate": { "latitude": 31.4697, "longitude": 74.3750 }, "icon": "🌫️", "severity": "CRITICAL", "statusBefore": "HAZARDOUS", "statusAfter": "HAZARDOUS" },
                { "id": "SEM-2", "type": "ROAD_CLOSURE", "title": "Ferozpur Toll Pileup", "coordinate": { "latitude": 31.4650, "longitude": 74.2880 }, "icon": "💥", "severity": "CRITICAL", "statusBefore": "PARTIAL CLOSURE (5 cars)", "statusAfter": "RESOLVED (Cleared)" },
                { "id": "SEM-3", "type": "TRAFFIC", "title": "Shahrah-e-Faisal Jam", "coordinate": { "latitude": 31.4780, "longitude": 74.3850 }, "icon": "🚗", "severity": "HIGH", "statusBefore": "CONGESTED (12km/h)", "statusAfter": "FLOWING (28km/h)" },
                { "id": "SEM-4", "type": "TRAFFIC", "title": "Main Boulevard DHA Warning", "coordinate": { "latitude": 31.4850, "longitude": 74.3910 }, "icon": "⚠️", "severity": "HIGH", "statusBefore": "SLOW (18km/h)", "statusAfter": "ADVISED (30km/h max)" },
                { "id": "SEM-5", "type": "SMOG", "title": "Airport Road Low Visibility", "coordinate": { "latitude": 31.5200, "longitude": 74.4000 }, "icon": "✈️", "severity": "CRITICAL", "statusBefore": "0.3km visibility", "statusAfter": "0.3km visibility" },
                { "id": "SEM-6", "type": "RESCUE", "title": "Rescue 1122 Ambulance", "coordinate": { "latitude": 31.5050, "longitude": 74.3720 }, "icon": "🚑", "severity": "LOW", "statusBefore": "DISPATCHED", "statusAfter": "ON_SITE" },
                { "id": "SEM-7", "type": "RESCUE", "title": "DHA Air Scrubber Unit", "coordinate": { "latitude": 31.4710, "longitude": 74.3680 }, "icon": "💧", "severity": "LOW", "statusBefore": "ON_SITE (Testing)", "statusAfter": "ON_SITE (Scrubbing)" },
                { "id": "SEM-8", "type": "TRAFFIC", "title": "M-2 Motorway Restriction", "coordinate": { "latitude": 31.4550, "longitude": 74.2750 }, "icon": "🚦", "severity": "MODERATE", "statusBefore": "NORMAL", "statusAfter": "30km/h MANDATORY SPEED" }
            ]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
