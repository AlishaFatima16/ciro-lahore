"""
Zone Service — Manages Lahore zone (Z01–Z12) state transitions.

Severity → ZoneState mapping:
  LOW      → YELLOW
  MEDIUM   → ORANGE
  HIGH     → RED
  CRITICAL → CRITICAL

If the zone does not exist in the database it is created on-the-fly.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import ZoneStatus
from app.core.enums import CrisisSeverity, ZoneState


# Map enum severity to zone alert colour
_SEVERITY_TO_ZONE: dict[str, ZoneState] = {
    CrisisSeverity.LOW.value:      ZoneState.YELLOW,
    CrisisSeverity.MEDIUM.value:   ZoneState.ORANGE,
    CrisisSeverity.HIGH.value:     ZoneState.RED,
    CrisisSeverity.CRITICAL.value: ZoneState.CRITICAL,
}


def transition_zone(
    db: Session,
    zone_id: str,
    severity: str,
    crisis_type: str,
) -> ZoneStatus:
    """
    Transition a zone to its new alert state based on crisis severity.

    Args:
        db:          Active SQLAlchemy session.
        zone_id:     Zone identifier, e.g. 'Z03'.
        severity:    CrisisSeverity value string.
        crisis_type: Human-readable crisis type stored as active_crisis.

    Returns:
        The updated ZoneStatus ORM object.
    """
    new_state = _SEVERITY_TO_ZONE.get(severity, ZoneState.YELLOW)

    zone: ZoneStatus | None = db.query(ZoneStatus).filter(
        ZoneStatus.zone_id == zone_id
    ).first()

    if zone is None:
        zone = ZoneStatus(
            zone_id=zone_id,
            status=new_state.value,
            active_crisis=crisis_type,
            updated_at=datetime.utcnow(),
        )
        db.add(zone)
    else:
        zone.status = new_state.value
        zone.active_crisis = crisis_type
        zone.updated_at = datetime.utcnow()

    db.flush()
    return zone


def clear_zone(db: Session, zone_id: str) -> ZoneStatus | None:
    """Reset a zone back to CLEAR state."""
    zone = db.query(ZoneStatus).filter(ZoneStatus.zone_id == zone_id).first()
    if zone:
        zone.status = ZoneState.CLEAR.value
        zone.active_crisis = None
        zone.updated_at = datetime.utcnow()
        db.flush()
    return zone


def get_all_zones(db: Session) -> list[ZoneStatus]:
    """Return all zone status records."""
    return db.query(ZoneStatus).order_by(ZoneStatus.zone_id).all()
