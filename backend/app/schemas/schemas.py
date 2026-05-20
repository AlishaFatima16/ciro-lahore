from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SignalIngest(BaseModel):
    signal: str
    floodRisk: bool = False
    smokeDetected: bool = False
    powerOutage: bool = False

class WorkflowResponse(BaseModel):
    workflow_id: str
    status: str
    detail: str

class CrisisInfo(BaseModel):
    detected: bool
    type: str
    subtype: str
    severity: str
    confidence: float
    location: str
    affectedArea: str
    estimatedAffected: str
    weather: Dict[str, str]
    traffic: Dict[str, Any]

class ActionLog(BaseModel):
    type: str
    status: str
    detail: str

class TicketInfo(BaseModel):
    id: str
    type: str
    priority: str
    status: str

class SimulationStatus(BaseModel):
    executed: bool
    before: Dict[str, Any]
    after: Dict[str, Any]
    summary: Dict[str, Any]
    actions: List[ActionLog]
    tickets: List[TicketInfo]

class MapZoneStatus(BaseModel):
    center: Dict[str, float]
    blockedRoutes: List[Dict[str, Any]]
    alternateRoutes: List[Dict[str, Any]]
    emergencyMarkers: List[Dict[str, Any]]
