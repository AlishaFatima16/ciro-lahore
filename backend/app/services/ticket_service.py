"""
Ticket Service — Simulates emergency ticket dispatch.

Generates a deterministic ticket ID in the format:
  <DEPT_PREFIX>-<ZONE>-<SHORT_UUID>
e.g.  RESCUE-Z03-7a2f1c

Each response plan action triggers one ticket. The result is written
to the Execution table with execution_type = TICKET_DISPATCH.
"""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import Execution
from app.core.enums import ExecutionType, ExecutionState


# Abbreviation map for department names → ticket prefix
_DEPT_PREFIX: dict[str, str] = {
    "WASA":               "WASA",
    "Traffic Police":     "TRAF",
    "RESCUE 1122":        "RESCUE",
    "EPA Punjab":         "EPA",
    "Health Department":  "HLTH",
    "PDMA":               "PDMA",
    "PHA":                "PHA",
}


def _make_ticket_id(department: str, zone_id: str | None) -> str:
    prefix = _DEPT_PREFIX.get(department, "DEPT")
    zone = zone_id or "ZXX"
    short = str(uuid.uuid4()).replace("-", "")[:6].upper()
    return f"{prefix}-{zone}-{short}"


def dispatch_ticket(
    db: Session,
    workflow_id: str,
    department: str,
    zone_id: str | None,
) -> Execution:
    """
    Create a simulated dispatch ticket and persist it.

    Args:
        db:           Active SQLAlchemy session.
        workflow_id:  Parent workflow UUID.
        department:   Responding department name.
        zone_id:      Affected zone identifier.

    Returns:
        The persisted Execution ORM object.
    """
    ticket_id = _make_ticket_id(department, zone_id)
    exec_record = Execution(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        ticket_id=ticket_id,
        execution_type=ExecutionType.TICKET_DISPATCH.value,
        status=ExecutionState.COMPLETED.value,
        recipients_count=None,
        executed_at=datetime.utcnow(),
    )
    db.add(exec_record)
    db.flush()
    return exec_record
