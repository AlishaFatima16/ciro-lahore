from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import models
from app.agents.crisis_detector import CrisisDetectorAgent
from app.agents.response_planner import ResponsePlannerAgent
from app.agents.action_executor import ActionExecutorAgent

class PipelineOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.agent1 = CrisisDetectorAgent()
        self.agent2 = ResponsePlannerAgent()
        self.agent3 = ActionExecutorAgent()

    def run_pipeline(self, signals: Dict[str, Any]) -> str:
        # Create workflow
        workflow = models.Workflow(status="RUNNING")
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        
        wid = workflow.id

        try:
            self._log(wid, "ORCHESTRATOR", "🚀 Antigravity Orchestrator initialized.")

            # Save signals
            sig_model = models.Signal(
                workflow_id=wid,
                social_signals=signals.get("signal", ""),
                rainfall_mm=signals.get("rainfall_mm", 0.0),
                aqi=signals.get("aqi", 0.0),
                visibility_km=signals.get("visibility_km", 10.0),
                congestion_ratio=signals.get("congestion_ratio", 0.0)
            )
            self.db.add(sig_model)

            # Agent 1
            self._log(wid, "CrisisDetectorAgent", "🔍 Initializing social and sensory signal ingestion scan...")
            detection = self.agent1.evaluate(signals)
            crisis = models.Crisis(
                workflow_id=wid,
                crisis_type=detection["crisis_type"],
                severity=detection["severity"],
                confidence=detection["confidence"],
                affected_zone=detection["affected_zone"]
            )
            self.db.add(crisis)
            self._log(wid, "CrisisDetectorAgent", f"🚨 Crisis detected: {detection['crisis_type']} with {detection['confidence']}% confidence.")

            # Confidence Gate
            if detection["confidence"] < 70.0:
                workflow.status = "HALTED"
                workflow.halt_reason = "LOW_CONFIDENCE"
                self._log(wid, "ORCHESTRATOR", "🛑 Workflow halted due to low confidence.")
                self.db.commit()
                return wid

            self._log(wid, "ORCHESTRATOR", "🔀 Severity verified. Transitioning to ResponsePlannerAgent.")

            # Agent 2
            plan_data = self.agent2.generate_plan(detection)
            for act in plan_data["response_plan"]:
                plan_model = models.ResponsePlan(
                    workflow_id=wid,
                    action=act["action"],
                    priority=act["priority"],
                    department=act["department"]
                )
                self.db.add(plan_model)
            self._log(wid, "ResponsePlannerAgent", f"✅ Generated {len(plan_data['response_plan'])} priority mitigation actions.")

            self._log(wid, "ORCHESTRATOR", "🔀 Route finalized. Transitioning to ActionExecutorAgent.")

            # Agent 3
            execution_data = self.agent3.simulate_execution(plan_data)
            for t in execution_data["tickets"]:
                exec_model = models.Execution(
                    workflow_id=wid,
                    ticket_id=t["id"],
                    execution_type=t["type"],
                    status=t["status"]
                )
                self.db.add(exec_model)
            self._log(wid, "ActionExecutorAgent", f"🚨 Dispatched {len(execution_data['tickets'])} simulated tickets.")

            workflow.status = "COMPLETED"
            self._log(wid, "ORCHESTRATOR", "✅ Swarm orchestration concluded successfully.")
            
            self.db.commit()
            return wid
        except Exception as e:
            try:
                self.db.rollback()
                # Use a clean transaction to mark workflow as failed
                failed_workflow = self.db.query(models.Workflow).filter(models.Workflow.id == wid).first()
                if failed_workflow:
                    failed_workflow.status = "FAILED"
                    self._log(wid, "ORCHESTRATOR", f"❌ Swarm orchestration failed: {str(e)}")
                    self.db.commit()
            except Exception as db_err:
                print(f"Error during rollback/fail-logging: {db_err}")
            raise

    def _log(self, wid: str, agent: str, message: str):
        log_entry = models.Log(workflow_id=wid, agent_name=agent, message=message)
        self.db.add(log_entry)
