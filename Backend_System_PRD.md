# Backend System PRD (Product Requirements Document)

## 1. Project Overview

CIRO Lahore (Crisis Intelligence & Response Orchestrator) is an agentic urban emergency response backend platform designed to simulate intelligent crisis detection and coordinated response workflows for Lahore city. The platform ingests multimodal telemetry including Roman Urdu public complaints, weather telemetry, and traffic telemetry, then orchestrates multiple specialized agents to detect crises, generate response strategies, simulate emergency execution, and maintain complete workflow traceability.

The system is designed as a backend-first architecture where all orchestration, reasoning, state management, execution simulation, logging, and workflow coordination occur inside the FastAPI backend. Frontend integration is optional during early development because Swagger UI provides complete API validation and testing capability.

The platform is intentionally designed as a deterministic orchestration engine rather than a generative autonomous AI system. All decisions, crisis classifications, routing logic, confidence scoring, and department assignments are rule-driven to minimize hallucinations and ensure explainable execution behavior.

## 2. System Objectives

The backend system must:

- Ingest multimodal crisis signals
- Parse Roman Urdu and English complaints
- Detect urban crises deterministically
- Assign severity and confidence levels
- Identify affected Lahore zones and roads
- Generate prioritized response plans
- Assign emergency departments
- Simulate coordinated emergency execution
- Maintain workflow state tracking
- Persist all workflow traces and logs
- Support asynchronous orchestration
- Expose all functionality through FastAPI APIs
- Remain fully testable via Swagger UI
- Minimize hallucinations through strict deterministic logic

## 3. High-Level System Architecture

```text
Multi-Source Signals
        ↓
FastAPI Ingestion Gateway
        ↓
Validation + Sanitization Layer
        ↓
Async Workflow Engine
        ↓
Agent Orchestrator
        ↓
Agent 1 — Crisis Detector
        ↓
Confidence Gate
   ↓ PASS      ↓ HALT
Agent 2       Workflow Halt
Response Plan
        ↓
Department Assignment Engine
        ↓
Agent 3 — Action Executor
        ↓
Zone State Manager
        ↓
Logging + Trace Engine
        ↓
SQLite (Development)
        ↓
PostgreSQL Migration Ready
        ↓
Swagger UI / Frontend
```

## 4. Backend Technology Stack

| Layer | Technology |
| --- | --- |
| API Framework | FastAPI |
| Validation | Pydantic |
| ORM | SQLAlchemy |
| Database (Development) | SQLite |
| Database (Production Path) | PostgreSQL |
| Migration Tool | Alembic |
| Async Task Handling | FastAPI BackgroundTasks |
| Future Queue Architecture | Celery + Redis |
| API Documentation | Swagger UI / OpenAPI |

## 5. Core Backend Modules

### 5.1 Ingestion Gateway

The ingestion gateway receives all incoming telemetry signals and initializes workflow execution.

**Responsibilities:**
- Accept external telemetry payloads
- Validate request structure
- Generate workflow IDs
- Start asynchronous orchestration
- Return immediate HTTP 202 responses

**Primary Endpoint:**
- `POST /api/workflow/run`

### 5.2 Validation Layer

The validation layer sanitizes and validates all incoming requests using Pydantic schemas.

**Responsibilities:**
- Validate required fields
- Prevent malformed payloads
- Normalize telemetry values
- Enforce schema integrity

### 5.3 Agent Orchestrator

The orchestrator controls agent sequencing, context passing, workflow state transitions, and execution flow.

**Responsibilities:**
- Trigger agent pipeline
- Maintain structured JSON context
- Enforce confidence gates
- Halt unsafe workflows
- Coordinate agent execution order

**Workflow Sequence:**
`Agent 1 → Confidence Gate → Agent 2 → Agent 3`

## 6. Agentic Layer

### 6.1 Agent 1 — Crisis Detector

**Purpose**
Agent 1 analyzes incoming telemetry and determines whether an urban crisis exists.

**Responsibilities**
- Parse Roman Urdu complaints
- Detect keyword patterns
- Analyze weather telemetry
- Analyze traffic telemetry
- Detect crisis types
- Assign severity
- Calculate confidence scores
- Identify affected Lahore zones
- Identify affected roads

**Supported Crisis Types**
- Urban Flooding
- Smog Crisis
- Road Accident
- Unknown

**Detection Rules**
*Urban Flooding*
- Conditions: `rainfall_mm > 50`, `congestion_ratio > 0.80`, flood keywords active

*Smog Crisis*
- Conditions: `aqi > 300` OR `visibility_km < 0.5`, smog keywords active

*Road Accident*
- Conditions: accident keywords active, `congestion_ratio > 0.75`

**Confidence Gate**
- If: `confidence < 70`
- Then: `Workflow Status = HALTED`
- Possible halt reason: `LOW_CONFIDENCE`

### 6.2 Agent 2 — Response Planner

**Purpose**
Agent 2 generates deterministic emergency response plans.

**Responsibilities**
- Generate prioritized actions
- Assign emergency departments
- Generate rerouting plans
- Estimate mitigation impact
- Generate public communication strategies

**Department Assignment Rules**
- *Urban Flooding*: WASA, Traffic Police, RESCUE 1122
- *Smog Crisis*: EPA Punjab, Health Department, Traffic Police
- *Road Accident*: RESCUE 1122, Traffic Police

**Constraints**
- Never invent departments
- Never invent Lahore roads
- Never generate non-deterministic actions

### 6.3 Agent 3 — Action Executor

**Purpose**
Agent 3 simulates emergency execution workflows.

**Responsibilities**
- Generate fake ticket IDs
- Simulate SMS broadcasts
- Simulate rerouting activation
- Update zone states
- Generate execution logs
- Maintain traceability

**Execution Rules**
- Generate realistic ticket IDs
- Generate `recipients_count` values
- Maintain timestamps
- Maintain workflow logs

## 7. Workflow Execution Model

The system must use asynchronous execution.

**Request lifecycle:**
```text
Client Request
    ↓
HTTP 202 Accepted
    ↓
Background Workflow Starts
    ↓
Agent Pipeline Executes
    ↓
Logs Persisted
    ↓
Workflow Completed
```
The client must never wait synchronously for workflow completion.

## 8. Workflow States

Supported workflow states:
- PENDING
- RUNNING
- HALTED
- FAILED
- COMPLETED

## 9. Halt Reasons

Supported halt reasons:
- LOW_CONFIDENCE
- INVALID_PAYLOAD
- ZONE_NOT_FOUND
- AGENT_FAILURE
- EXECUTION_TIMEOUT

## 10. Zone State Management

The backend maintains persistent state for Lahore operational zones.

**Startup Initialization**
On application startup:
- Z01 → CLEAR
- Z02 → CLEAR
- ...
- Z12 → CLEAR

**Allowed Zone States**
- CLEAR
- YELLOW
- ORANGE
- RED
- CRITICAL

## 11. SMS Simulation Engine

The backend simulates emergency public alerts.

**Responsibilities**
- Generate zone-based `recipients_count`
- Simulate emergency broadcasts
- Maintain execution logs

**Example:**
```json
{
  "public_alerted": true,
  "recipients_count": 45200
}
```

## 12. Database Architecture

SQLite is strictly development-only.
The architecture must remain fully PostgreSQL-compatible.

**Required Tables**
- `workflows`: workflow_id, status, halt_reason, started_at, completed_at
- `signals`: id, workflow_id, social_signals, weather_json, traffic_json
- `crises`: id, workflow_id, crisis_type, severity, confidence, affected_zone
- `response_plans`: id, workflow_id, action, priority, department
- `executions`: id, workflow_id, ticket_id, execution_type, status
- `zone_status`: zone_id, status, active_crisis, updated_at
- `logs`: id, workflow_id, agent_name, message, timestamp

## 13. Complete API Specification

**System Initialization**
- `POST /api/system/init`
- Purpose: Initialize zones, Load configuration, Validate mappings

**Start Workflow**
- `POST /api/workflow/run`
- Purpose: Start complete orchestration pipeline
- Response: 202 Accepted

**Workflow Status**
- `GET /api/workflow/status/{workflow_id}`
- Purpose: Retrieve workflow execution state

**Workflow Result**
- `GET /api/workflow/result/{workflow_id}`
- Purpose: Retrieve final orchestration output

**Crisis Detection Test**
- `POST /api/crisis/detect`
- Purpose: Standalone Agent 1 testing

**Response Planning Test**
- `POST /api/response/plan`
- Purpose: Standalone Agent 2 testing

**Action Execution Test**
- `POST /api/actions/execute`
- Purpose: Standalone Agent 3 testing

**Current Crisis State**
- `GET /api/crisis/current`
- Purpose: Retrieve active crisis state

**Zone Status**
- `GET /api/zones/status`
- Purpose: Retrieve operational zone states

**Agent Logs**
- `GET /api/logs/agents`
- Purpose: Retrieve agent-level traces

**Workflow Logs**
- `GET /api/logs/workflow/{workflow_id}`
- Purpose: Retrieve workflow traceability logs

**Health Check**
- `GET /health`
- Purpose: Service availability validation

## 14. Backend Folder Structure

```text
backend/
│
├── app/
│
├── agents/
│   ├── crisis_detector.py
│   ├── response_planner.py
│   ├── action_executor.py
│   └── orchestrator.py
│
├── routes/
│   ├── workflow_routes.py
│   ├── crisis_routes.py
│   ├── response_routes.py
│   ├── execution_routes.py
│   ├── zone_routes.py
│   └── logs_routes.py
│
├── schemas/
│   ├── signal_schema.py
│   ├── workflow_schema.py
│   ├── crisis_schema.py
│   └── execution_schema.py
│
├── services/
│   ├── sms_service.py
│   ├── ticket_service.py
│   ├── logging_service.py
│   ├── confidence_service.py
│   ├── zone_service.py
│   └── state_manager.py
│
├── database/
│   ├── models.py
│   ├── connection.py
│   └── seed.py
│
├── data/
│
├── tests/
│
└── main.py
```

## 15. API / Infrastructure References

- FastAPI Documentation
- FastAPI Background Tasks
- Pydantic Documentation
- SQLAlchemy Documentation
- Alembic Documentation
- AsyncPG Documentation
- Celery Documentation
- Redis Documentation
- Swagger UI Documentation
- OpenAPI Specification
