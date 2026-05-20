import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.connection import get_db, engine, Base
from app.database import models
from app.schemas.schemas import SignalIngest
from app.agents.orchestrator import PipelineOrchestrator
from app.database.seed import seed_zones
import uvicorn

# Initialize database & seed clear operational zones
Base.metadata.create_all(bind=engine)
seed_zones()

app = FastAPI(title="CIRO - Crisis Intelligence & Response Orchestrator API (Dynamic)", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain-specific router modules (FIX 4)
from app.routes.workflow_routes import router as workflow_router
from app.routes.crisis_routes import router as crisis_router
from app.routes.response_routes import router as response_router
from app.routes.action_routes import router as action_router
from app.routes.log_routes import router as log_router
from app.routes.system_routes import router as system_router
from app.routes.zone_routes import router as zone_router

app.include_router(workflow_router)
app.include_router(crisis_router)
app.include_router(response_router)
app.include_router(action_router)
app.include_router(log_router)
app.include_router(system_router)
app.include_router(zone_router)

latest_workflow_id = None

@app.post("/signals/ingest")
def post_signals_ingest(payload: SignalIngest, db: Session = Depends(get_db)):
    global latest_workflow_id
    
    # We will run the pipeline synchronously for the hackathon demo to ensure immediate results,
    # or async if we want to be fully compliant with the "BackgroundTasks" approach.
    # The PRD says HTTP 202, but mobile app might expect synchronous. We will do sync for now
    # to populate latest_workflow_id immediately.
    
    signals = {
        "signal": payload.signal,
        "floodRisk": payload.floodRisk,
        "smokeDetected": payload.smokeDetected,
        "powerOutage": payload.powerOutage,
        # Mocking some metrics based on payload to simulate real sensors
        "rainfall_mm": 94.0 if payload.floodRisk or "pani" in payload.signal.lower() else 0.0,
        "aqi": 387.0 if payload.smokeDetected or "smog" in payload.signal.lower() else 50.0,
        "visibility_km": 0.3 if payload.smokeDetected else 10.0,
        "congestion_ratio": 0.94 if payload.floodRisk else 0.84
    }
    
    orchestrator = PipelineOrchestrator(db)
    wid = orchestrator.run_pipeline(signals)
    latest_workflow_id = wid
    
    return {
        "status": "SUCCESS",
        "workflow_id": wid,
        "detail": "Swarm initialized and pipeline executed."
    }

# ── LAHORE DYNAMIC MAP DATASETS ────────────────────
LAHORE_MAPS = {
    "FLOOD": {
        "center": { "latitude": 31.5126, "longitude": 74.3533 }, # Liberty Chowk
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
            { "id": "FEM-1", "type": "FLOOD", "title": "Liberty Chowk Flooding", "coordinate": { "latitude": 31.5126, "longitude": 74.3533 }, "icon": "🌊", "severity": "CRITICAL", "statusBefore": "IMPASSABLE (Water Level 2.4ft)", "statusAfter": "CLEARING (0.2ft)" },
            { "id": "FEM-2", "type": "ROAD_CLOSURE", "title": "Liberty Underpass CLOSED", "coordinate": { "latitude": 31.5108, "longitude": 74.3512 }, "icon": "🚧", "severity": "CRITICAL", "statusBefore": "CLOSED (12 stranded)", "statusAfter": "RESOLVED (0 stranded)" },
            { "id": "FEM-3", "type": "ROAD_CLOSURE", "title": "Canal Road Overflow", "coordinate": { "latitude": 31.5220, "longitude": 74.3580 }, "icon": "🌊", "severity": "CRITICAL", "statusBefore": "CLOSED (Submerged)", "statusAfter": "PARTIALLY OPEN" },
            { "id": "FEM-4", "type": "TRAFFIC", "title": "MM Alam Road Gridlock", "coordinate": { "latitude": 31.5160, "longitude": 74.3485 }, "icon": "🚗", "severity": "HIGH", "statusBefore": "CONGESTED (3km/h)", "statusAfter": "FLOWING (18km/h)" },
            { "id": "FEM-5", "type": "REROUTE", "title": "Jail Road Reroute", "coordinate": { "latitude": 31.5310, "longitude": 74.3460 }, "icon": "🔀", "severity": "MODERATE", "statusBefore": "GRIDLOCK", "statusAfter": "RECOMMENDED (Green)" },
            { "id": "FEM-6", "type": "RESCUE", "title": "WASA Pump Dispatch", "coordinate": { "latitude": 31.4705, "longitude": 74.2405 }, "icon": "🚒", "severity": "LOW", "statusBefore": "PENDING", "statusAfter": "ON_SITE (4 pumps)" },
            { "id": "FEM-7", "type": "RESCUE", "title": "Rescue 1122 Medical", "coordinate": { "latitude": 31.5100, "longitude": 74.3450 }, "icon": "🚑", "severity": "LOW", "statusBefore": "EN_ROUTE", "statusAfter": "ON_SITE (Active)" },
            { "id": "FEM-8", "type": "TRAFFIC", "title": "Kalma Chowk Signal Override", "coordinate": { "latitude": 31.5030, "longitude": 74.3330 }, "icon": "🚦", "severity": "LOW", "statusBefore": "NORMAL_TIMER", "statusAfter": "90s GREEN EXTENSION" }
        ]
    },
    "SMOG": {
        "center": { "latitude": 31.4697, "longitude": 74.3750 }, # DHA Area
        "blockedRoutes": [
            { "id": "SBR-1", "name": "Ferozpur Road Pileup Section", "coordinates": [{ "latitude": 31.4650, "longitude": 74.2880 }, { "latitude": 31.4600, "longitude": 74.2800 }], "severity": "CRITICAL", "color": "#FF3B30" },
            { "id": "SBR-2", "name": "Shahrah-e-Faisal DHA Corridor", "coordinates": [{ "latitude": 31.4780, "longitude": 74.3850 }, { "latitude": 31.4730, "longitude": 74.3720 }], "severity": "HIGH", "color": "#FF9500" }
        ],
        "alternateRoutes": [
            { "id": "SAR-1", "name": "Ring Road Lahore Divert", "coordinates": [{ "latitude": 31.4800, "longitude": 74.4050 }, { "latitude": 31.4900, "longitude": 74.4150 }], "status": "ACTIVE", "color": "#34C759" },
            { "id": "SAR-2", "name": "Walton Road Bypass", "coordinates": [{ "latitude": 31.4880, "longitude": 74.3600 }, { "latitude": 31.4820, "longitude": 74.3500 }], "status": "ACTIVE", "color": "#30D158" }
        ],
        "emergencyMarkers": [
            { "id": "SEM-1", "type": "SMOG", "title": "DHA Y-Block (AQI 387)", "coordinate": { "latitude": 31.4697, "longitude": 74.3750 }, "icon": "🌫️", "severity": "CRITICAL", "statusBefore": "HAZARDOUS (AQI 387)", "statusAfter": "STABLE (Scrubbers active)" },
            { "id": "SEM-2", "type": "ROAD_CLOSURE", "title": "Ferozpur Toll Pileup", "coordinate": { "latitude": 31.4650, "longitude": 74.2880 }, "icon": "💥", "severity": "CRITICAL", "statusBefore": "PARTIAL CLOSURE (5 cars)", "statusAfter": "RESOLVED (Cleared)" },
            { "id": "SEM-3", "type": "TRAFFIC", "title": "Shahrah-e-Faisal Jam", "coordinate": { "latitude": 31.4780, "longitude": 74.3850 }, "icon": "🚗", "severity": "HIGH", "statusBefore": "CONGESTED (12km/h)", "statusAfter": "FLOWING (28km/h)" },
            { "id": "SEM-4", "type": "TRAFFIC", "title": "Main Boulevard DHA Warning", "coordinate": { "latitude": 31.4850, "longitude": 74.3910 }, "icon": "⚠️", "severity": "HIGH", "statusBefore": "SLOW (18km/h)", "statusAfter": "ADVISED (30km/h max)" },
            { "id": "SEM-5", "type": "SMOG", "title": "Airport Road Low Visibility", "coordinate": { "latitude": 31.5200, "longitude": 74.4000 }, "icon": "✈️", "severity": "CRITICAL", "statusBefore": "0.3km visibility", "statusAfter": "0.3km visibility" },
            { "id": "SEM-6", "type": "RESCUE", "title": "Rescue 1122 Ambulance", "coordinate": { "latitude": 31.5050, "longitude": 74.3720 }, "icon": "🚑", "severity": "LOW", "statusBefore": "DISPATCHED", "statusAfter": "ON_SITE" },
            { "id": "SEM-7", "type": "RESCUE", "title": "DHA Air Scrubber Unit", "coordinate": { "latitude": 31.4710, "longitude": 74.3680 }, "icon": "💧", "severity": "LOW", "statusBefore": "ON_SITE (Testing)", "statusAfter": "ON_SITE (Scrubbing)" },
            { "id": "SEM-8", "type": "TRAFFIC", "title": "M-2 Motorway Restriction", "coordinate": { "latitude": 31.4550, "longitude": 74.2750 }, "icon": "🚦", "severity": "MODERATE", "statusBefore": "NORMAL", "statusAfter": "30km/h MANDATORY SPEED" }
        ]
    }
}

@app.get("/crisis/current")
def get_crisis_current(db: Session = Depends(get_db)):
    global latest_workflow_id
    wf_id = latest_workflow_id
    if not wf_id:
        last_wf = db.query(models.Workflow).order_by(models.Workflow.started_at.desc()).first()
        if last_wf:
            wf_id = last_wf.id
        else:
            return {"detected": False}
        
    crisis = db.query(models.Crisis).filter(models.Crisis.workflow_id == wf_id).first()
    if not crisis:
        return {"detected": False}
        
    return {
        "detected": True,
        "type": crisis.crisis_type,
        "subtype": "Dynamic Pipeline Output",
        "severity": crisis.severity,
        "confidence": crisis.confidence,
        "location": crisis.affected_zone,
        "affectedArea": "Calculated Region",
        "estimatedAffected": "Unknown",
        "weather": {
            "condition": "Derived from sensors",
            "rainfall": "Dynamic",
            "windSpeed": "Dynamic",
            "forecast": "Dynamic"
        },
        "traffic": {
            "congestionLevel": "High",
            "avgSpeed": "Low",
            "vehiclesStranded": 0
        }
    }

@app.get("/agents/traces")
def get_agents_traces(db: Session = Depends(get_db)):
    global latest_workflow_id
    wf_id = latest_workflow_id
    if not wf_id:
        last_wf = db.query(models.Workflow).order_by(models.Workflow.started_at.desc()).first()
        if last_wf:
            wf_id = last_wf.id
        else:
            return {"status": "SUCCESS", "logs": []}
        
    logs = db.query(models.Log).filter(models.Log.workflow_id == wf_id).order_by(models.Log.timestamp).all()
    formatted_logs = []
    for idx, log in enumerate(logs):
        formatted_logs.append({
            "id": idx + 1,
            "timestamp": log.timestamp.strftime("%H:%M:%S") if hasattr(log.timestamp, "strftime") else (str(log.timestamp)[:19].split(" ")[-1] if log.timestamp else "00:00:00"),
            "agent": log.agent_name,
            "level": "info" if "initialized" in (log.message or "") or "Transitioning" in (log.message or "") else "success" if "✅" in (log.message or "") else "critical" if "🚨" in (log.message or "") else "system",
            "type": "DYNAMIC_LOG",
            "message": log.message,
            "state": "SUCCESS"
        })
        
    return {
        "status": "SUCCESS",
        "scenario": "DYNAMIC",
        "logs": formatted_logs
    }

@app.get("/simulation/status")
def get_simulation_status(db: Session = Depends(get_db)):
    global latest_workflow_id
    wf_id = latest_workflow_id
    if not wf_id:
        last_wf = db.query(models.Workflow).order_by(models.Workflow.started_at.desc()).first()
        if last_wf:
            wf_id = last_wf.id
        else:
            return {"executed": False}
        
    executions = db.query(models.Execution).filter(models.Execution.workflow_id == wf_id).all()
    plans = db.query(models.ResponsePlan).filter(models.ResponsePlan.workflow_id == wf_id).all()
    
    actions = [{"type": p.action, "status": "EXECUTED", "detail": p.department} for p in plans]
    tickets = [{"id": e.ticket_id, "type": e.execution_type, "priority": "P1", "status": e.status} for e in executions]
    
    return {
        "executed": True,
        "before": {"congestion": "High", "systemStatus": "CRISIS_UNMANAGED"},
        "after": {"congestion": "Low", "systemStatus": "CRISIS_MANAGED"},
        "summary": {"actionsExecuted": len(actions), "ticketsGenerated": len(tickets)},
        "actions": actions,
        "tickets": tickets
    }

@app.get("/map/zones")
def get_map_zones(db: Session = Depends(get_db)):
    global latest_workflow_id
    wf_id = latest_workflow_id
    if not wf_id:
        last_wf = db.query(models.Workflow).order_by(models.Workflow.started_at.desc()).first()
        if last_wf:
            wf_id = last_wf.id
            
    scenario = "FLOOD"
    if wf_id:
        crisis = db.query(models.Crisis).filter(models.Crisis.workflow_id == wf_id).first()
        if crisis and "smog" in crisis.crisis_type.lower():
            scenario = "SMOG"
            
    zones = db.query(models.ZoneStatus).all()
    zones_data = [
        {
            "zone_id": z.zone_id,
            "status": z.status,
            "active_crisis": z.active_crisis,
            "updated_at": z.updated_at.isoformat() if z.updated_at else None
        }
        for z in zones
    ]
    
    response = dict(LAHORE_MAPS[scenario])
    response["zones"] = zones_data
    return response

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
