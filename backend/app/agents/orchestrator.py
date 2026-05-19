"""
Orchestrator — Asynchronous pipeline manager.

Runs agents A1 → A2 → A3 in sequence as a FastAPI BackgroundTask.
Responsibilities:
  • Create workflow record and assign UUID4.
  • Generate request_hash for idempotency.
  • Propagate trace_id across all agent logs.
  • Apply confidence gate after A1 (< halt_threshold → HALTED).
  • Catch all agent exceptions and transition workflow to FAILED.
  • Set completed_at and COMPLETED status on success.
"""
import hashlib
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.database.models import Workflow
from app.core.enums import WorkflowState, HaltReason, AgentName
from app.services.logging_service import log_event
from app.services.confidence_service import passes_gate
from app.schemas.signal_schema import TelemetrySignalRequest

import app.agents.crisis_detector  as crisis_detector
import app.agents.response_planner as response_planner
import app.agents.action_executor  as action_executor


def _compute_hash(payload: TelemetrySignalRequest) -> str:
    """SHA-256 hash of the serialised payload for idempotency checks."""
    raw = json.dumps(payload.model_dump(), sort_keys=True, default=str)
    return hashlib.sha256(raw.encode()).hexdigest()


def _fail_workflow(
    db: Session,
    workflow: Workflow,
    reason: HaltReason,
    trace_id: str,
    message: str,
) -> None:
    workflow.status = WorkflowState.FAILED.value
    workflow.halt_reason = reason.value
    workflow.completed_at = datetime.utcnow()
    db.flush()
    log_event(
        db=db,
        agent_name=AgentName.ORCHESTRATOR,
        message=message,
        workflow_id=workflow.id,
        trace_id=trace_id,
        parent_agent=AgentName.SYSTEM,
    )
    db.commit()


def run_workflow(workflow_id: str, payload: TelemetrySignalRequest) -> None:
    """
    Background task entry point. Opens its own DB session.

    Args:
        workflow_id:  Pre-created workflow UUID.
        payload:      Validated TelemetrySignalRequest from the API layer.
    """
    db: Session = SessionLocal()
    trace_id: str = str(uuid.uuid4())

    try:
        # ── Fetch workflow ─────────────────────────────────────────────────
        workflow: Workflow | None = db.query(Workflow).filter(
            Workflow.id == workflow_id
        ).first()

        if workflow is None:
            db.close()
            return

        # ── Mark RUNNING ───────────────────────────────────────────────────
        workflow.status = WorkflowState.RUNNING.value
        workflow.request_hash = _compute_hash(payload)
        db.flush()

        log_event(
            db=db,
            agent_name=AgentName.ORCHESTRATOR,
            message=f"Orchestration started | trace_id={trace_id} | source={payload.source}",
            workflow_id=workflow_id,
            trace_id=trace_id,
            parent_agent=AgentName.SYSTEM,
        )

        # ── Agent 1: Crisis Detector ───────────────────────────────────────
        try:
            detection = crisis_detector.run(
                db=db,
                workflow_id=workflow_id,
                complaint_text=payload.complaint_text,
                rainfall_mm=payload.weather.rainfall_mm,
                aqi=payload.weather.aqi,
                visibility_km=payload.weather.visibility_km,
                congestion_ratio=payload.traffic.congestion_ratio,
                avg_speed_kmh=payload.traffic.avg_speed_kmh,
                zone_hint=payload.zone_hint,
                social_signals=[payload.complaint_text],
                weather_json=payload.weather.model_dump(),
                traffic_json=payload.traffic.model_dump(),
                trace_id=trace_id,
            )
        except Exception as exc:
            _fail_workflow(
                db, workflow, HaltReason.AGENT_FAILURE, trace_id,
                f"Agent 1 (CrisisDetector) failed: {exc}"
            )
            return

        # ── Confidence gate ────────────────────────────────────────────────
        if not passes_gate(detection.confidence):
            workflow.status = WorkflowState.HALTED.value
            workflow.halt_reason = HaltReason.LOW_CONFIDENCE.value
            workflow.completed_at = datetime.utcnow()
            db.flush()
            log_event(
                db=db,
                agent_name=AgentName.ORCHESTRATOR,
                message=(
                    f"Workflow HALTED — confidence {detection.confidence:.1f}% "
                    f"below gate threshold | crisis_type={detection.crisis_type}"
                ),
                workflow_id=workflow_id,
                trace_id=trace_id,
                parent_agent=AgentName.SYSTEM,
            )
            db.commit()
            return

        # ── Agent 2: Response Planner ──────────────────────────────────────
        try:
            plans = response_planner.run(
                db=db,
                workflow_id=workflow_id,
                detection=detection,
                trace_id=trace_id,
            )
        except Exception as exc:
            _fail_workflow(
                db, workflow, HaltReason.AGENT_FAILURE, trace_id,
                f"Agent 2 (ResponsePlanner) failed: {exc}"
            )
            return

        # ── Agent 3: Action Executor ───────────────────────────────────────
        try:
            executions = action_executor.run(
                db=db,
                workflow_id=workflow_id,
                detection=detection,
                plans=plans,
                trace_id=trace_id,
            )
        except Exception as exc:
            _fail_workflow(
                db, workflow, HaltReason.AGENT_FAILURE, trace_id,
                f"Agent 3 (ActionExecutor) failed: {exc}"
            )
            return

        # ── Mark COMPLETED ─────────────────────────────────────────────────
        workflow.status = WorkflowState.COMPLETED.value
        workflow.completed_at = datetime.utcnow()
        db.flush()

        log_event(
            db=db,
            agent_name=AgentName.ORCHESTRATOR,
            message=(
                f"Orchestration COMPLETED | crisis={detection.crisis_type} "
                f"| severity={detection.severity} | confidence={detection.confidence:.1f}% "
                f"| zone={detection.affected_zone or 'UNKNOWN'} "
                f"| executions={len(executions)}"
            ),
            workflow_id=workflow_id,
            trace_id=trace_id,
            parent_agent=AgentName.SYSTEM,
        )
        db.commit()

    except Exception as exc:
        # Last-resort catch — prevents silent crash in BackgroundTask
        try:
            wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
            if wf:
                wf.status = WorkflowState.FAILED.value
                wf.halt_reason = HaltReason.AGENT_FAILURE.value
                wf.completed_at = datetime.utcnow()
                db.commit()
        except Exception:
            pass
        raise

    finally:
        db.close()
