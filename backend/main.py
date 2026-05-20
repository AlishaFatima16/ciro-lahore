import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.connection import get_db, engine, Base
from app.database import models
from app.schemas.schemas import SignalIngest
from app.agents.orchestrator import PipelineOrchestrator
import uvicorn

# Initialize database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CIRO - Crisis Intelligence & Response Orchestrator API (Dynamic)", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/crisis/current")
def get_crisis_current(db: Session = Depends(get_db)):
    global latest_workflow_id
    if not latest_workflow_id:
        return {"detected": False}
        
    crisis = db.query(models.Crisis).filter(models.Crisis.workflow_id == latest_workflow_id).first()
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
    if not latest_workflow_id:
        return {"status": "SUCCESS", "logs": []}
        
    logs = db.query(models.Log).filter(models.Log.workflow_id == latest_workflow_id).order_by(models.Log.timestamp).all()
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
    if not latest_workflow_id:
        return {"executed": False}
        
    executions = db.query(models.Execution).filter(models.Execution.workflow_id == latest_workflow_id).all()
    plans = db.query(models.ResponsePlan).filter(models.ResponsePlan.workflow_id == latest_workflow_id).all()
    
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
    # Raise a 501 Not Implemented so the mobile app's try/catch block 
    # seamlessly falls back to its beautiful static mock map markers!
    raise HTTPException(status_code=501, detail="Map generation not yet implemented in backend")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
