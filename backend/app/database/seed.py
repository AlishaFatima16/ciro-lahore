from datetime import datetime
from app.database.connection import SessionLocal
from app.database.models import ZoneStatus
from app.core.enums import ZoneState


ZONES = ["Z01", "Z02", "Z03", "Z04", "Z05", "Z06", "Z07", "Z08", "Z09", "Z10", "Z11", "Z12"]


def seed_zones():
    """Initialize all Lahore operational zones to CLEAR state on startup."""
    db = SessionLocal()
    try:
        for zone_id in ZONES:
            existing = db.query(ZoneStatus).filter(ZoneStatus.zone_id == zone_id).first()
            if not existing:
                zone = ZoneStatus(
                    zone_id=zone_id,
                    status=ZoneState.CLEAR.value,
                    active_crisis=None,
                    updated_at=datetime.utcnow(),
                )
                db.add(zone)
        db.commit()
        print(f"[SEED] Zones initialized: {', '.join(ZONES)}")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Zone seeding failed: {e}")
    finally:
        db.close()
