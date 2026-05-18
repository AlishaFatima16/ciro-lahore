"""
SMS Service — Simulates public SMS broadcast execution.

Generates a realistic recipient count based on crisis severity:
  LOW      →  500 – 2,000
  MEDIUM   → 2,000 – 10,000
  HIGH     → 10,000 – 50,000
  CRITICAL → 50,000 – 200,000

Result is written to the Execution table with
execution_type = SMS_BROADCAST.
"""
import uuid
import random
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import Execution
from app.core.enums import ExecutionType, ExecutionState, CrisisSeverity

# Deterministic seed ranges per severity
_RECIPIENT_RANGES: dict[str, tuple[int, int]] = {
    CrisisSeverity.LOW.value:      (500,    2_000),
    CrisisSeverity.MEDIUM.value:   (2_000,  10_000),
    CrisisSeverity.HIGH.value:     (10_000, 50_000),
    CrisisSeverity.CRITICAL.value: (50_000, 200_000),
}


def broadcast_sms(
    db: Session,
    workflow_id: str,
    severity: str,
    zone_id: str | None,
) -> Execution:
    """
    Simulate an SMS broadcast and persist the execution record.

    Args:
        db:           Active SQLAlchemy session.
        workflow_id:  Parent workflow UUID.
        severity:     CrisisSeverity value string.
        zone_id:      Affected zone (used for ticket_id tagging).

    Returns:
        The persisted Execution ORM object.
    """
    low, high = _RECIPIENT_RANGES.get(severity, (100, 500))
    recipients = random.randint(low, high)

    zone_tag = zone_id or "ZXX"
    ticket_id = f"SMS-{zone_tag}-{str(uuid.uuid4()).replace('-','')[:6].upper()}"

    exec_record = Execution(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        ticket_id=ticket_id,
        execution_type=ExecutionType.SMS_BROADCAST.value,
        status=ExecutionState.COMPLETED.value,
        recipients_count=recipients,
        executed_at=datetime.utcnow(),
    )
    db.add(exec_record)
    db.flush()
    return exec_record
