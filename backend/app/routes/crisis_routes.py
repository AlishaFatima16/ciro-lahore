"""
Crisis Routes — /api/v1/crisis/

POST /api/v1/crisis/detect
    Standalone Agent 1 endpoint. Runs the Crisis Detector synchronously
    (no DB persistence) for direct testing and integration.
"""
import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.crisis_schema import CrisisDetectRequest, CrisisDetectResponse
from app.core.config_loader import get_keywords, get_thresholds, get_zones
from app.services.confidence_service import calculate_confidence, passes_gate

router = APIRouter(prefix="/api/v1/crisis", tags=["Crisis Detection"])


def _resolve_zone_standalone(text_lower: str, zone_hint: str | None) -> tuple[str | None, list[str]]:
    zones_cfg = get_zones()
    if zone_hint and zone_hint.upper() in zones_cfg:
        entry = zones_cfg[zone_hint.upper()]
        return zone_hint.upper(), entry.get("roads", [])
    for zone_id, entry in zones_cfg.items():
        for keyword in entry.get("keywords", []):
            if keyword.lower() in text_lower:
                return zone_id, entry.get("roads", [])
    return None, []


@router.post(
    "/detect",
    response_model=CrisisDetectResponse,
    summary="Standalone Agent 1 — detect crisis from telemetry",
)
def detect_crisis(payload: CrisisDetectRequest):
    """
    Run Agent 1 synchronously without persisting to the database.
    Useful for testing detection logic in isolation.
    """
    keywords_cfg = get_keywords()
    thresholds   = get_thresholds()
    text_lower   = payload.complaint_text.lower()

    # Keyword matching
    keyword_counts: dict[str, int] = {}
    keyword_matches: list[str] = []
    for category, words in keywords_cfg.items():
        count = 0
        for word in words:
            if word.lower() in text_lower:
                count += text_lower.count(word.lower())
                keyword_matches.append(word)
        keyword_counts[category] = count

    flood_t    = thresholds.get("flood", {})
    smog_t     = thresholds.get("smog", {})
    accident_t = thresholds.get("accident", {})

    flood_flags   = [payload.rainfall_mm > flood_t.get("rainfall_mm", 50),
                     payload.congestion_ratio > flood_t.get("congestion_ratio", 0.80)]
    smog_flags    = [payload.aqi > smog_t.get("aqi", 300),
                     payload.visibility_km < smog_t.get("visibility_km", 0.5)]
    accident_flags = [payload.congestion_ratio > accident_t.get("congestion_ratio", 0.75)]

    is_flood    = any(flood_flags)    and keyword_counts.get("flood", 0)    >= flood_t.get("min_keyword_matches", 1)
    is_smog     = any(smog_flags)     and keyword_counts.get("smog", 0)     >= smog_t.get("min_keyword_matches", 1)
    is_accident = any(accident_flags) and keyword_counts.get("accident", 0) >= accident_t.get("min_keyword_matches", 1)

    rules: list[str] = []

    if is_flood:
        crisis_type = "Urban Flooding"
        confidence  = calculate_confidence("flood", keyword_counts["flood"], flood_flags)
        rules.append(f"rainfall_mm({payload.rainfall_mm}) > {flood_t.get('rainfall_mm', 50)}")
        if payload.congestion_ratio > flood_t.get("congestion_ratio", 0.80):
            rules.append(f"congestion_ratio({payload.congestion_ratio:.2f}) > {flood_t.get('congestion_ratio', 0.80)}")
        severity = "CRITICAL" if payload.rainfall_mm > 100 else "HIGH" if payload.rainfall_mm > 75 else "MEDIUM"
    elif is_smog:
        crisis_type = "Smog Crisis"
        confidence  = calculate_confidence("smog", keyword_counts["smog"], smog_flags)
        if payload.aqi > smog_t.get("aqi", 300):
            rules.append(f"aqi({payload.aqi}) > {smog_t.get('aqi', 300)}")
        if payload.visibility_km < smog_t.get("visibility_km", 0.5):
            rules.append(f"visibility_km({payload.visibility_km}) < {smog_t.get('visibility_km', 0.5)}")
        severity = "CRITICAL" if payload.aqi > 400 else "HIGH" if payload.aqi > 350 else "MEDIUM"
    elif is_accident:
        crisis_type = "Road Accident"
        confidence  = calculate_confidence("accident", keyword_counts["accident"], accident_flags)
        rules.append(f"congestion_ratio({payload.congestion_ratio:.2f}) > {accident_t.get('congestion_ratio', 0.75)}")
        severity = "CRITICAL" if payload.congestion_ratio > 0.95 else "HIGH" if payload.congestion_ratio > 0.85 else "MEDIUM"
    else:
        crisis_type = "Unknown"
        confidence  = 0.0
        severity    = "LOW"
        rules.append("No threshold rules triggered")

    affected_zone, affected_roads = _resolve_zone_standalone(text_lower, payload.zone_hint)

    return CrisisDetectResponse(
        crisis_type=crisis_type,
        severity=severity,
        confidence=confidence,
        affected_zone=affected_zone,
        affected_roads=affected_roads,
        keyword_matches=list(set(keyword_matches)),
        detection_rules_triggered=rules,
        passed_confidence_gate=passes_gate(confidence),
    )
