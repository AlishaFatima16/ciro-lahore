import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


# -----------------------------------------------------------------------
# Workflow — Root entity for every orchestration pipeline execution
# -----------------------------------------------------------------------
class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    halt_reason: Mapped[str | None] = mapped_column(String(50), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Idempotency + Retry support
    request_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    last_retry_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    max_retry_limit: Mapped[int] = mapped_column(Integer, default=3)

    # Relationships
    signals: Mapped[list["Signal"]] = relationship("Signal", back_populates="workflow", cascade="all, delete")
    crises: Mapped[list["Crisis"]] = relationship("Crisis", back_populates="workflow", cascade="all, delete")
    response_plans: Mapped[list["ResponsePlan"]] = relationship("ResponsePlan", back_populates="workflow", cascade="all, delete")
    executions: Mapped[list["Execution"]] = relationship("Execution", back_populates="workflow", cascade="all, delete")
    logs: Mapped[list["Log"]] = relationship("Log", back_populates="workflow", cascade="all, delete")


# -----------------------------------------------------------------------
# Signal — Raw + normalized telemetry ingested for a workflow
# -----------------------------------------------------------------------
class Signal(Base):
    __tablename__ = "signals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    workflow_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflows.id"), nullable=False)

    # Raw JSON storage
    social_signals: Mapped[str | None] = mapped_column(Text, nullable=True)
    weather_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    traffic_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Normalized analytics columns
    rainfall_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    aqi: Mapped[float | None] = mapped_column(Float, nullable=True)
    visibility_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    congestion_ratio: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="signals")


# -----------------------------------------------------------------------
# Crisis — Agent 1 detection output
# -----------------------------------------------------------------------
class Crisis(Base):
    __tablename__ = "crises"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    workflow_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflows.id"), nullable=False)
    crisis_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    affected_zone: Mapped[str | None] = mapped_column(String(10), nullable=True)
    affected_roads: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON list stored as text

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="crises")


# -----------------------------------------------------------------------
# ResponsePlan — Agent 2 generated action items
# -----------------------------------------------------------------------
class ResponsePlan(Base):
    __tablename__ = "response_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    workflow_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflows.id"), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="response_plans")


# -----------------------------------------------------------------------
# Execution — Agent 3 simulated execution records
# -----------------------------------------------------------------------
class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    workflow_id: Mapped[str] = mapped_column(String(36), ForeignKey("workflows.id"), nullable=False)
    ticket_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    execution_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="COMPLETED")
    recipients_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="executions")


# -----------------------------------------------------------------------
# ZoneStatus — Persistent operational state for Lahore zones Z01–Z12
# -----------------------------------------------------------------------
class ZoneStatus(Base):
    __tablename__ = "zone_status"

    zone_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="CLEAR")
    active_crisis: Mapped[str | None] = mapped_column(String(50), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -----------------------------------------------------------------------
# Log — Structured agent and orchestrator trace records
# -----------------------------------------------------------------------
class Log(Base):
    __tablename__ = "logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    workflow_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("workflows.id"), nullable=True)
    agent_name: Mapped[str] = mapped_column(String(60), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Observability extensions
    trace_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    execution_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    parent_agent: Mapped[str | None] = mapped_column(String(60), nullable=True)

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="logs")
