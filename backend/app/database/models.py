from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    status = Column(String(20), nullable=False, default="PENDING")
    halt_reason = Column(String(50), nullable=True)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    request_hash = Column(String(64), nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    last_retry_at = Column(DateTime, nullable=True)
    max_retry_limit = Column(Integer, nullable=False, default=3)

    crises = relationship("Crisis", back_populates="workflow")
    executions = relationship("Execution", back_populates="workflow")
    logs = relationship("Log", back_populates="workflow")
    response_plans = relationship("ResponsePlan", back_populates="workflow")
    signals = relationship("Signal", back_populates="workflow")


class ZoneStatus(Base):
    __tablename__ = "zone_status"
    zone_id = Column(String(10), primary_key=True)
    status = Column(String(20), nullable=False, default="CLEAR")
    active_crisis = Column(String(50), nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Crisis(Base):
    __tablename__ = "crises"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    crisis_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    affected_zone = Column(String(10), nullable=True)
    affected_roads = Column(Text, nullable=True)

    workflow = relationship("Workflow", back_populates="crises")


class Execution(Base):
    __tablename__ = "executions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    ticket_id = Column(String(50), nullable=True)
    execution_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    recipients_count = Column(Integer, nullable=True)
    executed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    workflow = relationship("Workflow", back_populates="executions")


class Log(Base):
    __tablename__ = "logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=True)
    agent_name = Column(String(60), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    trace_id = Column(String(36), nullable=True)
    execution_ms = Column(Integer, nullable=True)
    parent_agent = Column(String(60), nullable=True)

    workflow = relationship("Workflow", back_populates="logs")


class ResponsePlan(Base):
    __tablename__ = "response_plans"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    action = Column(Text, nullable=False)
    priority = Column(Integer, nullable=False)
    department = Column(String(100), nullable=False)

    workflow = relationship("Workflow", back_populates="response_plans")


class Signal(Base):
    __tablename__ = "signals"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    workflow_id = Column(String(36), ForeignKey("workflows.id"), nullable=False)
    social_signals = Column(Text, nullable=True)
    weather_json = Column(Text, nullable=True)
    traffic_json = Column(Text, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    aqi = Column(Float, nullable=True)
    visibility_km = Column(Float, nullable=True)
    congestion_ratio = Column(Float, nullable=True)
    avg_speed_kmh = Column(Float, nullable=True)

    workflow = relationship("Workflow", back_populates="signals")
