"""
Agent 3 — Action Executor

Simulates physical execution of emergency response actions:
  • Generates UUID-based dispatch tickets per department.
  • Broadcasts SMS alerts with realistic recipient counts.
  • Updates zone status in the ZoneStatus table.
  • Writes a ZONE_UPDATE execution record.
  • Logs full execution trail with trace_id.
"""
import time
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.enums import AgentName, ExecutionType, ExecutionState
from app.database.models import Execution
from app.services.logging_service import log_event
from app.services.ticket_service import dispatch_ticket
from app.services.sms_service import broadcast_sms
from app.services.zone_service import transition_zone
from app.schemas.crisis_schema import CrisisDetectResponse


def run(
    db: Session,
    workflow_id: str,
    detection: CrisisDetectResponse,
    plans: list[dict],
    trace_id: str,
) -> list[dict]:
    """
    Execute Agent 3 — Action Executor.

    For each response plan:
      1. Dispatch a ticket to the assigned department.
      2. If public_alert is applicable, trigger SMS broadcast once.
      3. Update affected zone status.

    Args:
        db:           Active SQLAlchemy session.
        workflow_id:  Parent workflow UUID.
        detection:    Structured output from Agent 1.
        plans:        List of response plan dicts from Agent 2.
        trace_id:     Correlation ID for this orchestration run.

    Returns:
        List of execution summary dicts.
    """
    t_start = time.perf_counter()
    executions_summary: list[dict] = []
    sms_sent = False

    # ── 1. Dispatch tickets for each plan ──────────────────────────────────
    for plan in plans:
        ticket_exec = dispatch_ticket(
            db=db,
            workflow_id=workflow_id,
            department=plan["department"],
            zone_id=detection.affected_zone,
        )
        executions_summary.append({
            "ticket_id":      ticket_exec.ticket_id,
            "execution_type": ticket_exec.execution_type,
            "status":         ticket_exec.status,
            "department":     plan["department"],
            "action":         plan["action"],
            "priority":       plan["priority"],
            "executed_at":    ticket_exec.executed_at.isoformat(),
        })

        # ── 2. First plan triggers SMS broadcast ─────────────────────────
        if not sms_sent:
            sms_exec = broadcast_sms(
                db=db,
                workflow_id=workflow_id,
                severity=detection.severity,
                zone_id=detection.affected_zone,
            )
            executions_summary.append({
                "ticket_id":       sms_exec.ticket_id,
                "execution_type":  sms_exec.execution_type,
                "status":          sms_exec.status,
                "recipients_count": sms_exec.recipients_count,
                "executed_at":     sms_exec.executed_at.isoformat(),
            })
            sms_sent = True

    # ── 3. Zone transition ─────────────────────────────────────────────────
    if detection.affected_zone:
        zone = transition_zone(
            db=db,
            zone_id=detection.affected_zone,
            severity=detection.severity,
            crisis_type=detection.crisis_type,
        )

        # Persist ZONE_UPDATE execution record
        zone_exec = Execution(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            ticket_id=f"ZONE-{detection.affected_zone}-{str(uuid.uuid4()).replace('-','')[:6].upper()}",
            execution_type=ExecutionType.ZONE_UPDATE.value,
            status=ExecutionState.COMPLETED.value,
            recipients_count=None,
            executed_at=datetime.utcnow(),
        )
        db.add(zone_exec)
        db.flush()

        executions_summary.append({
            "ticket_id":      zone_exec.ticket_id,
            "execution_type": zone_exec.execution_type,
            "status":         zone_exec.status,
            "zone_id":        detection.affected_zone,
            "new_zone_state": zone.status,
            "executed_at":    zone_exec.executed_at.isoformat(),
        })

    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    log_event(
        db=db,
        agent_name=AgentName.ACTION_EXECUTOR,
        message=(
            f"Executed {len(executions_summary)} actions for {detection.crisis_type} "
            f"| Zone: {detection.affected_zone or 'UNKNOWN'} → {detection.severity} state | "
            f"SMS sent: {sms_sent}"
        ),
        workflow_id=workflow_id,
        trace_id=trace_id,
        execution_ms=elapsed_ms,
        parent_agent=AgentName.ORCHESTRATOR,
    )

    return executions_summary
