"""
Action Routes — /api/v1/actions/

POST /api/v1/actions/execute
    Standalone Agent 3 endpoint. Simulates ticket dispatch + SMS broadcast
    for a given crisis type and severity without a full workflow.
"""
import uuid
import random
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.core.enums import CrisisSeverity

router = APIRouter(prefix="/api/v1/actions", tags=["Action Execution"])


_SMS_RANGES = {
    CrisisSeverity.LOW.value:      (500,    2_000),
    CrisisSeverity.MEDIUM.value:   (2_000,  10_000),
    CrisisSeverity.HIGH.value:     (10_000, 50_000),
    CrisisSeverity.CRITICAL.value: (50_000, 200_000),
}

_DEPT_PREFIX = {
    "WASA":              "WASA",
    "Traffic Police":    "TRAF",
    "RESCUE 1122":       "RESCUE",
    "EPA Punjab":        "EPA",
    "Health Department": "HLTH",
}


class ExecuteRequest(BaseModel):
    crisis_type: str  = Field(..., examples=["Urban Flooding"])
    severity:    str  = Field(..., examples=["HIGH"])
    department:  str  = Field(..., examples=["RESCUE 1122"])
    zone_id:     str | None = Field(default=None, examples=["Z03"])


class ExecuteResult(BaseModel):
    ticket_id:       str
    sms_ticket_id:   str
    recipients_count: int
    status:          str
    simulated_at:    str


@router.post(
    "/execute",
    response_model=ExecuteResult,
    summary="Standalone Agent 3 — simulate execution",
)
def execute_action(payload: ExecuteRequest):
    """
    Simulate dispatch ticket + SMS broadcast without touching the database.
    """
    from datetime import datetime, timezone

    prefix   = _DEPT_PREFIX.get(payload.department, "DEPT")
    zone_tag = payload.zone_id or "ZXX"
    short    = str(uuid.uuid4()).replace("-", "")[:6].upper()
    ticket   = f"{prefix}-{zone_tag}-{short}"

    sms_short  = str(uuid.uuid4()).replace("-", "")[:6].upper()
    sms_ticket = f"SMS-{zone_tag}-{sms_short}"

    low, high = _SMS_RANGES.get(payload.severity, (100, 500))
    recipients = random.randint(low, high)

    return ExecuteResult(
        ticket_id=ticket,
        sms_ticket_id=sms_ticket,
        recipients_count=recipients,
        status="COMPLETED",
        simulated_at=datetime.now(timezone.utc).isoformat(),
    )
