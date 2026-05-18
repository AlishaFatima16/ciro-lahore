"""
Log Routes — /api/v1/logs/

GET /api/v1/logs/workflow/{workflow_id}
    Returns all structured agent trace logs for a given workflow,
    ordered chronologically with execution_ms and trace_id included.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Log, Workflow
from app.schemas.workflow_schema import LogEntry

router = APIRouter(prefix="/api/v1/logs", tags=["Observability Logs"])


@router.get(
    "/workflow/{workflow_id}",
    response_model=list[LogEntry],
    summary="Get all agent logs for a workflow",
)
def get_workflow_logs(workflow_id: str, db: Session = Depends(get_db)):
    """
    Return all Log table entries for the given workflow,
    ordered by timestamp ascending.
    """
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")

    logs = (
        db.query(Log)
        .filter(Log.workflow_id == workflow_id)
        .order_by(Log.timestamp.asc())
        .all()
    )

    return [
        LogEntry(
            id=l.id,
            workflow_id=l.workflow_id,
            agent_name=l.agent_name,
            message=l.message,
            timestamp=l.timestamp.isoformat(),
            trace_id=l.trace_id,
            execution_ms=l.execution_ms,
            parent_agent=l.parent_agent,
        )
        for l in logs
    ]
