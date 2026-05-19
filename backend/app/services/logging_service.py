"""
Logging Service — Structured observability layer.
Writes agent trace records to the Log table including trace_id,
execution_ms, and parent_agent for full pipeline traceability.
"""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import Log
from app.core.enums import AgentName


def log_event(
    db: Session,
    agent_name: AgentName | str,
    message: str,
    workflow_id: str | None = None,
    trace_id: str | None = None,
    execution_ms: int | None = None,
    parent_agent: AgentName | str | None = None,
) -> Log:
    """
    Persist a structured log entry to the database.

    Args:
        db:            Active SQLAlchemy session.
        agent_name:    Name of the agent or component emitting the log.
        message:       Human-readable log message.
        workflow_id:   UUID of the associated workflow (optional for system logs).
        trace_id:      UUID used to correlate logs across a single orchestration run.
        execution_ms:  Time in milliseconds the agent took to produce this log.
        parent_agent:  The agent that invoked this agent (for call-graph tracing).

    Returns:
        The persisted Log ORM object.
    """
    agent_str = agent_name.value if isinstance(agent_name, AgentName) else agent_name
    parent_str = parent_agent.value if isinstance(parent_agent, AgentName) else parent_agent

    entry = Log(
        id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        agent_name=agent_str,
        message=message,
        timestamp=datetime.utcnow(),
        trace_id=trace_id,
        execution_ms=execution_ms,
        parent_agent=parent_str,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
