"""
System Routes — /api/v1/system/

GET /api/v1/system/init
    Health + initialisation probe. Creates all DB tables and seeds zones.
    Safe to call repeatedly — uses CREATE IF NOT EXISTS semantics.
"""
from fastapi import APIRouter
from app.database.connection import engine
from app.database.models import (
    Workflow, Signal, Crisis, ResponsePlan, Execution, ZoneStatus, Log
)
from app.database.connection import Base
from app.database.seed import seed_zones

router = APIRouter(prefix="/api/v1/system", tags=["System"])


@router.get(
    "/init",
    summary="Initialise database tables and seed zones",
)
def system_init():
    """
    Idempotent initialisation endpoint.
    Creates all SQLAlchemy tables (if not present) and seeds Z01–Z12.
    """
    Base.metadata.create_all(bind=engine)
    seed_zones()
    return {
        "status": "ok",
        "message": "Database initialised and zones seeded.",
        "tables": [
            "workflows", "signals", "crises",
            "response_plans", "executions", "zone_status", "logs"
        ],
    }
