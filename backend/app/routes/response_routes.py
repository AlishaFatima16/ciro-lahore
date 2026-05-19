"""
Response Routes — /api/v1/response/

POST /api/v1/response/plan
    Standalone Agent 2 endpoint. Accepts a crisis_type and returns the
    deterministic department assignments and action list from departments.json.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.core.config_loader import get_departments

router = APIRouter(prefix="/api/v1/response", tags=["Response Planning"])


class ResponsePlanRequest(BaseModel):
    crisis_type: str = Field(
        ...,
        description="One of: 'Urban Flooding', 'Smog Crisis', 'Road Accident'",
        examples=["Urban Flooding"],
    )


class ResponsePlanResult(BaseModel):
    crisis_type:  str
    departments:  list[str]
    actions:      list[str]
    rerouting:    bool
    public_alert: bool


_KEY_MAP = {
    "Urban Flooding": "flood",
    "Smog Crisis":    "smog",
    "Road Accident":  "accident",
}


@router.post(
    "/plan",
    response_model=ResponsePlanResult,
    summary="Standalone Agent 2 — generate response plan",
)
def generate_plan(payload: ResponsePlanRequest):
    """
    Return the deterministic response plan for a given crisis type
    without persisting anything to the database.
    """
    crisis_key = _KEY_MAP.get(payload.crisis_type)
    if not crisis_key:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown crisis_type '{payload.crisis_type}'. "
                   f"Valid options: {list(_KEY_MAP.keys())}",
        )

    cfg = get_departments().get(crisis_key, {})

    return ResponsePlanResult(
        crisis_type=payload.crisis_type,
        departments=cfg.get("departments", []),
        actions=cfg.get("actions", []),
        rerouting=cfg.get("rerouting", False),
        public_alert=cfg.get("public_alert", False),
    )
