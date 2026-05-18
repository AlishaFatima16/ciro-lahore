from typing import Optional, List
from pydantic import BaseModel, Field


class CrisisDetectRequest(BaseModel):
    """Standalone Agent 1 test payload — POST /api/v1/crisis/detect"""
    complaint_text: str = Field(..., min_length=5, max_length=2000)
    rainfall_mm: float = Field(default=0.0, ge=0)
    aqi: float = Field(default=0.0, ge=0)
    visibility_km: float = Field(default=10.0, ge=0)
    congestion_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    avg_speed_kmh: float = Field(default=60.0, ge=0)
    zone_hint: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "complaint_text": "Barish ki wajah se paani jam gaya aur rasta band ho gaya",
                "rainfall_mm": 65.0,
                "aqi": 90.0,
                "visibility_km": 2.0,
                "congestion_ratio": 0.85,
                "avg_speed_kmh": 10.0,
                "zone_hint": "Z03"
            }
        }


class CrisisDetectResponse(BaseModel):
    """Agent 1 structured output."""
    crisis_type: str
    severity: str
    confidence: float
    affected_zone: Optional[str]
    affected_roads: List[str]
    keyword_matches: List[str]
    detection_rules_triggered: List[str]
    passed_confidence_gate: bool
