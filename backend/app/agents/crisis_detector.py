"""
Agent 1 — Crisis Detector

100% deterministic. Uses config files (keywords.json, thresholds.json, zones.json)
to produce a structured crisis assessment with no hallucinations.

Detection logic:
  1. Tokenise complaint_text → count keyword matches per crisis category.
  2. Evaluate telemetry flags against threshold rules.
  3. Determine dominant crisis_type (flood > smog > accident by priority when tied).
  4. Resolve zone_id via zone_hint or keyword-to-area matching.
  5. Calculate confidence score via confidence_service.
  6. Write Signal and Crisis records + agent log to database.
"""
import json
import time
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.enums import AgentName, CrisisType, CrisisSeverity, HaltReason
from app.core.config_loader import get_keywords, get_thresholds, get_zones
from app.database.models import Signal, Crisis
from app.services.confidence_service import calculate_confidence, passes_gate
from app.services.logging_service import log_event
from app.schemas.crisis_schema import CrisisDetectResponse


# ── Severity matrix ──────────────────────────────────────────────────────────

def _flood_severity(rainfall_mm: float, congestion_ratio: float) -> CrisisSeverity:
    if rainfall_mm > 100 or congestion_ratio > 0.95:
        return CrisisSeverity.CRITICAL
    if rainfall_mm > 75 or congestion_ratio > 0.85:
        return CrisisSeverity.HIGH
    if rainfall_mm > 50 or congestion_ratio > 0.75:
        return CrisisSeverity.MEDIUM
    return CrisisSeverity.LOW


def _smog_severity(aqi: float, visibility_km: float) -> CrisisSeverity:
    if aqi > 400 or visibility_km < 0.1:
        return CrisisSeverity.CRITICAL
    if aqi > 350 or visibility_km < 0.3:
        return CrisisSeverity.HIGH
    if aqi > 300 or visibility_km < 0.5:
        return CrisisSeverity.MEDIUM
    return CrisisSeverity.LOW


def _accident_severity(congestion_ratio: float, avg_speed_kmh: float) -> CrisisSeverity:
    if congestion_ratio > 0.95 or avg_speed_kmh < 5:
        return CrisisSeverity.CRITICAL
    if congestion_ratio > 0.85 or avg_speed_kmh < 15:
        return CrisisSeverity.HIGH
    if congestion_ratio > 0.75 or avg_speed_kmh < 25:
        return CrisisSeverity.MEDIUM
    return CrisisSeverity.LOW


# ── Zone resolution ──────────────────────────────────────────────────────────

def _resolve_zone(text_lower: str, zone_hint: str | None) -> tuple[str | None, list[str]]:
    """Return (zone_id, affected_roads) from zone_hint or keyword matching."""
    zones_cfg = get_zones()

    # Prefer explicit hint
    if zone_hint and zone_hint.upper() in zones_cfg:
        entry = zones_cfg[zone_hint.upper()]
        return zone_hint.upper(), entry.get("roads", [])

    # Keyword scan through all zones
    for zone_id, entry in zones_cfg.items():
        for keyword in entry.get("keywords", []):
            if keyword.lower() in text_lower:
                return zone_id, entry.get("roads", [])

    return None, []


# ── Main agent function ──────────────────────────────────────────────────────

def run(
    db: Session,
    workflow_id: str,
    complaint_text: str,
    rainfall_mm: float,
    aqi: float,
    visibility_km: float,
    congestion_ratio: float,
    avg_speed_kmh: float,
    zone_hint: str | None,
    social_signals: list[str] | None,
    weather_json: dict | None,
    traffic_json: dict | None,
    trace_id: str,
) -> CrisisDetectResponse:
    """
    Execute Agent 1 — Crisis Detector.

    Persists a Signal record, evaluates telemetry, detects crisis type,
    computes confidence, persists a Crisis record, and logs the event.

    Returns a CrisisDetectResponse with all detection metadata.
    Raises RuntimeError on unrecoverable failure (triggers AGENT_FAILURE halt).
    """
    t_start = time.perf_counter()

    # ── 1. Persist raw signal ─────────────────────────────────────────────
    signal = Signal(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        social_signals=json.dumps(social_signals or []),
        weather_json=json.dumps(weather_json or {}),
        traffic_json=json.dumps(traffic_json or {}),
        rainfall_mm=rainfall_mm,
        aqi=aqi,
        visibility_km=visibility_km,
        congestion_ratio=congestion_ratio,
        avg_speed_kmh=avg_speed_kmh,
    )
    db.add(signal)
    db.flush()

    # ── 2. Keyword matching ───────────────────────────────────────────────
    keywords_cfg = get_keywords()
    text_lower = complaint_text.lower()

    keyword_counts: dict[str, int] = {}
    keyword_matches: list[str] = []

    for category, words in keywords_cfg.items():
        count = 0
        for word in words:
            if word.lower() in text_lower:
                count += text_lower.count(word.lower())
                keyword_matches.append(word)
        keyword_counts[category] = count

    # ── 3. Telemetry rule evaluation ─────────────────────────────────────
    thresholds = get_thresholds()

    flood_t   = thresholds.get("flood", {})
    smog_t    = thresholds.get("smog", {})
    accident_t = thresholds.get("accident", {})

    flood_flags   = [rainfall_mm > flood_t.get("rainfall_mm", 50),
                     congestion_ratio > flood_t.get("congestion_ratio", 0.80)]
    smog_flags    = [aqi > smog_t.get("aqi", 300),
                     visibility_km < smog_t.get("visibility_km", 0.5)]
    accident_flags = [congestion_ratio > accident_t.get("congestion_ratio", 0.75)]

    # ── 4. Determine crisis type (priority: flood > smog > accident) ───────
    is_flood    = any(flood_flags)    and keyword_counts.get("flood", 0)    >= flood_t.get("min_keyword_matches", 1)
    is_smog     = any(smog_flags)     and keyword_counts.get("smog", 0)     >= smog_t.get("min_keyword_matches", 1)
    is_accident = any(accident_flags) and keyword_counts.get("accident", 0) >= accident_t.get("min_keyword_matches", 1)

    rules_triggered: list[str] = []

    if is_flood:
        crisis_key   = "flood"
        crisis_type  = CrisisType.URBAN_FLOODING
        severity     = _flood_severity(rainfall_mm, congestion_ratio)
        confidence   = calculate_confidence("flood", keyword_counts["flood"], flood_flags)
        rules_triggered.append(f"rainfall_mm({rainfall_mm}) > {flood_t.get('rainfall_mm', 50)}")
        if congestion_ratio > flood_t.get("congestion_ratio", 0.80):
            rules_triggered.append(f"congestion_ratio({congestion_ratio:.2f}) > {flood_t.get('congestion_ratio', 0.80)}")

    elif is_smog:
        crisis_key   = "smog"
        crisis_type  = CrisisType.SMOG_CRISIS
        severity     = _smog_severity(aqi, visibility_km)
        confidence   = calculate_confidence("smog", keyword_counts["smog"], smog_flags)
        if aqi > smog_t.get("aqi", 300):
            rules_triggered.append(f"aqi({aqi}) > {smog_t.get('aqi', 300)}")
        if visibility_km < smog_t.get("visibility_km", 0.5):
            rules_triggered.append(f"visibility_km({visibility_km}) < {smog_t.get('visibility_km', 0.5)}")

    elif is_accident:
        crisis_key   = "accident"
        crisis_type  = CrisisType.ROAD_ACCIDENT
        severity     = _accident_severity(congestion_ratio, avg_speed_kmh)
        confidence   = calculate_confidence("accident", keyword_counts["accident"], accident_flags)
        rules_triggered.append(f"congestion_ratio({congestion_ratio:.2f}) > {accident_t.get('congestion_ratio', 0.75)}")

    else:
        crisis_key   = "unknown"
        crisis_type  = CrisisType.UNKNOWN
        severity     = CrisisSeverity.LOW
        confidence   = 0.0
        rules_triggered.append("No threshold rules triggered")

    # ── 5. Resolve zone ───────────────────────────────────────────────────
    affected_zone, affected_roads = _resolve_zone(text_lower, zone_hint)

    # ── 6. Persist Crisis record ──────────────────────────────────────────
    crisis = Crisis(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        crisis_type=crisis_type.value,
        severity=severity.value,
        confidence=confidence,
        affected_zone=affected_zone,
        affected_roads=json.dumps(affected_roads),
    )
    db.add(crisis)
    db.flush()

    # ── 7. Log ────────────────────────────────────────────────────────────
    elapsed_ms = int((time.perf_counter() - t_start) * 1000)
    log_event(
        db=db,
        agent_name=AgentName.CRISIS_DETECTOR,
        message=(
            f"Detected: {crisis_type.value} | Severity: {severity.value} | "
            f"Confidence: {confidence:.1f}% | Zone: {affected_zone or 'UNKNOWN'} | "
            f"Keywords: {len(keyword_matches)} | Rules: {', '.join(rules_triggered)}"
        ),
        workflow_id=workflow_id,
        trace_id=trace_id,
        execution_ms=elapsed_ms,
        parent_agent=AgentName.ORCHESTRATOR,
    )

    return CrisisDetectResponse(
        crisis_type=crisis_type.value,
        severity=severity.value,
        confidence=confidence,
        affected_zone=affected_zone,
        affected_roads=affected_roads,
        keyword_matches=list(set(keyword_matches)),
        detection_rules_triggered=rules_triggered,
        passed_confidence_gate=passes_gate(confidence),
    )
