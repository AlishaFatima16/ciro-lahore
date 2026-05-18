"""
Agent 2 — Response Planner

100% deterministic. Reads departments.json to assign prioritised
response actions and departments for a detected crisis.

Each action from the config is turned into a ResponsePlan row with
a monotonically increasing priority (1 = highest).
If rerouting is required, a REROUTING Execution is also queued.
"""
import time
import uuid
from sqlalchemy.orm import Session

from app.core.enums import AgentName, ExecutionType, ExecutionState
from app.core.config_loader import get_departments
from app.database.models import ResponsePlan, Execution
from app.services.logging_service import log_event
from app.schemas.crisis_schema import CrisisDetectResponse


def run(
    db: Session,
    workflow_id: str,
    detection: CrisisDetectResponse,
    trace_id: str,
) -> list[dict]:
    """
    Execute Agent 2 — Response Planner.

    Generates one ResponsePlan row per action and persists rerouting
    executions when the crisis type requires it.

    Args:
        db:           Active SQLAlchemy session.
        workflow_id:  Parent workflow UUID.
        detection:    Structured output from Agent 1.
        trace_id:     Correlation ID for this orchestration run.

    Returns:
        List of response plan dicts for downstream use by Agent 3.
    """
    t_start = time.perf_counter()

    departments_cfg = get_departments()

    # Map crisis_type display name → config key
    crisis_key_map = {
        "Urban Flooding": "flood",
        "Smog Crisis":    "smog",
        "Road Accident":  "accident",
    }
    crisis_key = crisis_key_map.get(detection.crisis_type, None)
    cfg = departments_cfg.get(crisis_key, {}) if crisis_key else {}

    actions     = cfg.get("actions", ["Standby — crisis type unknown, awaiting reclassification"])
    departments = cfg.get("departments", ["Emergency Operations Centre"])
    needs_rerouting = cfg.get("rerouting", False)
    needs_alert     = cfg.get("public_alert", False)

    plans: list[dict] = []

    # Create one ResponsePlan per action, cycling through departments
    for priority, action in enumerate(actions, start=1):
        dept = departments[(priority - 1) % len(departments)]
        plan = ResponsePlan(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            action=action,
            priority=priority,
            department=dept,
        )
        db.add(plan)
        db.flush()

        plans.append({
            "plan_id":    plan.id,
            "priority":   priority,
            "department": dept,
            "action":     action,
        })

    # Persist REROUTING execution record if required
    if needs_rerouting and detection.affected_zone:
        reroute = Execution(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            ticket_id=f"ROUTE-{detection.affected_zone}-{str(uuid.uuid4()).replace('-','')[:6].upper()}",
            execution_type=ExecutionType.REROUTING.value,
            status=ExecutionState.COMPLETED.value,
            recipients_count=None,
        )
        db.add(reroute)
        db.flush()

    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    log_event(
        db=db,
        agent_name=AgentName.RESPONSE_PLANNER,
        message=(
            f"Generated {len(plans)} response actions for {detection.crisis_type} "
            f"| Departments: {', '.join(departments)} "
            f"| Rerouting: {needs_rerouting} | Public Alert: {needs_alert}"
        ),
        workflow_id=workflow_id,
        trace_id=trace_id,
        execution_ms=elapsed_ms,
        parent_agent=AgentName.ORCHESTRATOR,
    )

    return plans
