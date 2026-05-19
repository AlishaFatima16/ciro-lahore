"""
Workflow Routes — /api/v1/workflow/

POST /api/v1/workflow/run
    Accepts a TelemetrySignalRequest and immediately returns 202 Accepted.
    The orchestration pipeline runs as a FastAPI BackgroundTask.

GET  /api/v1/workflow/status/{workflow_id}
    Poll workflow lifecycle state.

GET  /api/v1/workflow/result/{workflow_id}
    Fetch full structured output once a workflow is COMPLETED.
"""
import uuid
import json
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Workflow, Signal, Crisis, ResponsePlan, Execution, Log
from app.schemas.signal_schema import TelemetrySignalRequest
from app.schemas.workflow_schema import (
    WorkflowAcceptedResponse,
    WorkflowStatusResponse,
    WorkflowResultResponse,
)
from app.agents.orchestrator import run_workflow

router = APIRouter(prefix="/api/v1/workflow", tags=["Workflow"])


# ── POST /run ────────────────────────────────────────────────────────────────

@router.post(
    "/run",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=WorkflowAcceptedResponse,
    summary="Submit a new crisis telemetry workflow",
)
def submit_workflow(
    payload: TelemetrySignalRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Accepts multimodal urban telemetry and dispatches the orchestration
    pipeline (A1 → A2 → A3) as a background task.

    Returns 202 immediately with the workflow_id for status polling.
    """
    workflow_id = str(uuid.uuid4())

    workflow = Workflow(
        id=workflow_id,
        status="PENDING",
        started_at=datetime.utcnow(),
    )
    db.add(workflow)
    db.commit()

    background_tasks.add_task(run_workflow, workflow_id, payload)

    return WorkflowAcceptedResponse(
        workflow_id=workflow_id,
        status="PENDING",
        message="Workflow accepted. Orchestration running in background.",
        submitted_at=datetime.utcnow().isoformat(),
    )


# ── GET /status/{id} ─────────────────────────────────────────────────────────

@router.get(
    "/status/{workflow_id}",
    response_model=WorkflowStatusResponse,
    summary="Poll workflow status",
)
def get_workflow_status(workflow_id: str, db: Session = Depends(get_db)):
    """Return the current lifecycle state of a workflow."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")

    return WorkflowStatusResponse(
        workflow_id=wf.id,
        status=wf.status,
        halt_reason=wf.halt_reason,
        started_at=wf.started_at.isoformat() if wf.started_at else None,
        completed_at=wf.completed_at.isoformat() if wf.completed_at else None,
        retry_count=wf.retry_count,
    )


# ── GET /result/{id} ─────────────────────────────────────────────────────────

@router.get(
    "/result/{workflow_id}",
    response_model=WorkflowResultResponse,
    summary="Retrieve full workflow result",
)
def get_workflow_result(workflow_id: str, db: Session = Depends(get_db)):
    """Return the full structured output of a completed workflow."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")

    if wf.status not in ("COMPLETED", "HALTED", "FAILED"):
        raise HTTPException(
            status_code=400,
            detail=f"Workflow is still {wf.status}. Poll /status first.",
        )

    # ── Collect agent outputs ─────────────────────────────────────────────
    crises   = db.query(Crisis).filter(Crisis.workflow_id == workflow_id).all()
    plans    = db.query(ResponsePlan).filter(ResponsePlan.workflow_id == workflow_id).all()
    execs    = db.query(Execution).filter(Execution.workflow_id == workflow_id).all()
    logs_raw = db.query(Log).filter(Log.workflow_id == workflow_id).order_by(Log.timestamp).all()

    agent_outputs = {
        "crisis_detection": [
            {
                "crisis_type":  c.crisis_type,
                "severity":     c.severity,
                "confidence":   c.confidence,
                "affected_zone": c.affected_zone,
                "affected_roads": json.loads(c.affected_roads) if c.affected_roads else [],
            }
            for c in crises
        ],
        "response_plans": [
            {
                "priority":   p.priority,
                "department": p.department,
                "action":     p.action,
            }
            for p in sorted(plans, key=lambda x: x.priority)
        ],
    }

    execution_summary = {
        "total_executions": len(execs),
        "executions": [
            {
                "ticket_id":       e.ticket_id,
                "execution_type":  e.execution_type,
                "status":          e.status,
                "recipients_count": e.recipients_count,
                "executed_at":     e.executed_at.isoformat() if e.executed_at else None,
            }
            for e in execs
        ],
    }

    logs_out = [
        {
            "id":           l.id,
            "agent_name":   l.agent_name,
            "message":      l.message,
            "timestamp":    l.timestamp.isoformat(),
            "trace_id":     l.trace_id,
            "execution_ms": l.execution_ms,
            "parent_agent": l.parent_agent,
        }
        for l in logs_raw
    ]

    return WorkflowResultResponse(
        workflow_id=wf.id,
        workflow_status=wf.status,
        halt_reason=wf.halt_reason,
        started_at=wf.started_at.isoformat() if wf.started_at else None,
        completed_at=wf.completed_at.isoformat() if wf.completed_at else None,
        agent_outputs=agent_outputs,
        execution_summary=execution_summary,
        zone_updates=[],   # populated via /zones/status
        logs=logs_out,
    )
