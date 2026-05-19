from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel


class WorkflowAcceptedResponse(BaseModel):
    """Immediate 202 response returned when a workflow is submitted."""
    workflow_id: str
    status: str
    message: str
    submitted_at: str

    class Config:
        json_schema_extra = {
            "example": {
                "workflow_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                "status": "PENDING",
                "message": "Workflow accepted. Orchestration running in background.",
                "submitted_at": "2025-01-01T12:00:00"
            }
        }


class WorkflowStatusResponse(BaseModel):
    """Status polling response for GET /api/v1/workflow/status/{id}"""
    workflow_id: str
    status: str
    halt_reason: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    retry_count: int = 0


class CrisisOutput(BaseModel):
    crisis_type: str
    severity: str
    confidence: float
    affected_zone: Optional[str]
    affected_roads: Optional[List[str]]


class ResponseActionOutput(BaseModel):
    priority: int
    department: str
    action: str


class ExecutionOutput(BaseModel):
    ticket_id: Optional[str]
    execution_type: str
    status: str
    recipients_count: Optional[int]
    executed_at: str


class WorkflowResultResponse(BaseModel):
    """Full orchestration result for GET /api/v1/workflow/result/{id}"""
    workflow_id: str
    workflow_status: str
    halt_reason: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    agent_outputs: dict = {}
    execution_summary: dict = {}
    zone_updates: List[dict] = []
    logs: List[dict] = []


class LogEntry(BaseModel):
    id: str
    workflow_id: Optional[str]
    agent_name: str
    message: str
    timestamp: str
    trace_id: Optional[str]
    execution_ms: Optional[int]
    parent_agent: Optional[str]
