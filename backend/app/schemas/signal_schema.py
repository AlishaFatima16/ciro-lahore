from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class WeatherTelemetry(BaseModel):
    rainfall_mm: float = Field(default=0.0, ge=0, description="Rainfall in millimeters")
    aqi: float = Field(default=0.0, ge=0, description="Air Quality Index")
    visibility_km: float = Field(default=10.0, ge=0, description="Visibility in kilometers")
    temperature_c: Optional[float] = Field(default=None, description="Temperature in Celsius")
    humidity_percent: Optional[float] = Field(default=None, ge=0, le=100)


class TrafficTelemetry(BaseModel):
    congestion_ratio: float = Field(default=0.0, ge=0.0, le=1.0, description="0.0 = free flow, 1.0 = full block")
    avg_speed_kmh: float = Field(default=60.0, ge=0, description="Average vehicle speed in km/h")
    incident_reported: bool = Field(default=False, description="Whether a traffic incident was reported")
    affected_road: Optional[str] = Field(default=None, description="Name of the affected road")


class TelemetrySignalRequest(BaseModel):
    """Incoming payload for POST /api/v1/workflow/run"""
    complaint_text: str = Field(
        ...,
        min_length=5,
        max_length=2000,
        description="Roman Urdu or English complaint or report text"
    )
    zone_hint: Optional[str] = Field(
        default=None,
        description="Optional zone hint (e.g. 'Z03') to assist detection"
    )
    weather: WeatherTelemetry = Field(default_factory=WeatherTelemetry)
    traffic: TrafficTelemetry = Field(default_factory=TrafficTelemetry)
    source: Optional[str] = Field(default="manual", description="Signal source: manual, sensor, social_media")

    @field_validator("complaint_text")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "complaint_text": "Gulberg mein paani aa gaya, sarak band ho gayi, bahut barish ho rahi hai",
                "zone_hint": "Z01",
                "weather": {
                    "rainfall_mm": 75.0,
                    "aqi": 120.0,
                    "visibility_km": 1.5,
                    "temperature_c": 28.0,
                    "humidity_percent": 95.0
                },
                "traffic": {
                    "congestion_ratio": 0.88,
                    "avg_speed_kmh": 8.0,
                    "incident_reported": True,
                    "affected_road": "Main Boulevard"
                },
                "source": "social_media"
            }
        }
