from enum import Enum


class WorkflowState(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    HALTED = "HALTED"
    FAILED = "FAILED"
    COMPLETED = "COMPLETED"


class HaltReason(str, Enum):
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    INVALID_PAYLOAD = "INVALID_PAYLOAD"
    ZONE_NOT_FOUND = "ZONE_NOT_FOUND"
    AGENT_FAILURE = "AGENT_FAILURE"
    EXECUTION_TIMEOUT = "EXECUTION_TIMEOUT"


class CrisisType(str, Enum):
    URBAN_FLOODING = "Urban Flooding"
    SMOG_CRISIS = "Smog Crisis"
    ROAD_ACCIDENT = "Road Accident"
    UNKNOWN = "Unknown"


class CrisisSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ZoneState(str, Enum):
    CLEAR = "CLEAR"
    YELLOW = "YELLOW"
    ORANGE = "ORANGE"
    RED = "RED"
    CRITICAL = "CRITICAL"


class ExecutionState(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ExecutionType(str, Enum):
    SMS_BROADCAST = "SMS_BROADCAST"
    TICKET_DISPATCH = "TICKET_DISPATCH"
    REROUTING = "REROUTING"
    ZONE_UPDATE = "ZONE_UPDATE"


class AgentName(str, Enum):
    CRISIS_DETECTOR = "Agent1_CrisisDetector"
    RESPONSE_PLANNER = "Agent2_ResponsePlanner"
    ACTION_EXECUTOR = "Agent3_ActionExecutor"
    ORCHESTRATOR = "Orchestrator"
    SYSTEM = "System"
