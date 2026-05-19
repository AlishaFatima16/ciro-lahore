"""
Zone Routes — /api/v1/zones/

GET /api/v1/zones/status
    Returns current operational state of all Lahore zones (Z01–Z12).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app.database.models import ZoneStatus

router = APIRouter(prefix="/api/v1/zones", tags=["Zone Status"])


class ZoneStatusOut(BaseModel):
    zone_id:       str
    status:        str
    active_crisis: str | None
    updated_at:    str | None


@router.get(
    "/status",
    response_model=list[ZoneStatusOut],
    summary="Get operational status of all Lahore zones",
)
def get_zone_status(db: Session = Depends(get_db)):
    """Return the live alert state for all zones Z01–Z12."""
    zones = db.query(ZoneStatus).order_by(ZoneStatus.zone_id).all()
    return [
        ZoneStatusOut(
            zone_id=z.zone_id,
            status=z.status,
            active_crisis=z.active_crisis,
            updated_at=z.updated_at.isoformat() if z.updated_at else None,
        )
        for z in zones
    ]
