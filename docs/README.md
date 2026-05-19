# CIRO — Crisis Intelligence & Response Orchestrator
### Hackathon Submission | Antigravity Orchestration Track

---

## 🏗️ Project Structure

```
CIRO-HACKATHON/
├── backend/                  ← Node.js API server + 4 agents
│   ├── server.js             ← Express server (port 3001)
│   ├── agents/
│   │   ├── orchestrator.js   ← Master agent coordinator
│   │   ├── eventDetectionAgent.js
│   │   ├── reasoningAgent.js
│   │   ├── actionPlanningAgent.js
│   │   ├── simulationAgent.js
│   │   └── traceStore.js     ← In-memory state & log store
│   └── data/mockData.js      ← Demo crisis signals
│
├── antigravity/              ← Antigravity orchestration engine
│   ├── index.js              ← Engine entry point
│   ├── orchestrator.js       ← CIROOrchestrator class
│   ├── demo.js               ← Interactive demo runner
│   ├── agents/agentDefinitions.js   ← 8 agent definitions
│   └── workflows/crisisWorkflow.js  ← 3 workflow definitions
│
├── mobile-app/ciro-mob/      ← React Native Expo app
│   ├── App.js
│   ├── src/
│   │   ├── navigation/AppNavigator.js
│   │   ├── services/api.js   ← Axios API service
│   │   └── screens/
│   │       ├── DashboardScreen.js   ← Live crisis overview
│   │       ├── MapScreen.js         ← Satellite map + routes
│   │       ├── LogsScreen.js        ← Antigravity trace logs
│   │       └── SimulationScreen.js  ← Before/after results
│
└── docs/
    └── README.md             ← This file
```

---

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd CIRO-HACKATHON/backend
npm install
npm run dev
# → Running on http://localhost:3001
```

### 2. Run the Antigravity Demo

```bash
cd CIRO-HACKATHON/antigravity
npm install
node demo.js
# → Full multi-agent trace output in terminal
```

### 3. Start the Mobile App

```bash
cd CIRO-HACKATHON/mobile-app/ciro-mob
npx expo start
# → Scan QR with Expo Go app
# → For Android emulator: press 'a'
```

> ⚠️ **Physical Device**: Change `BASE_URL` in `src/services/api.js`  
> from `10.0.2.2:3001` → your machine's LAN IP (e.g. `192.168.1.X:3001`)

---

## 🤖 Agent Architecture

| Agent | Role | Key Output |
|-------|------|-----------|
| **EventDetectionAgent** | Classifies signals, detects anomalies, clusters events | Crisis type, severity score |
| **ReasoningAgent** | Multi-source confidence scoring, builds crisis model | Confidence %, weather+traffic correlation |
| **ActionPlanningAgent** | Plans rerouting, dispatch, alerts, resources | Coordinated action plan |
| **SimulationAgent** | Executes plan, generates before/after comparison | Tickets, execution trace |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/demo` | Run full 4-agent pipeline |
| `POST` | `/api/ingest` | Submit custom signals |
| `GET`  | `/api/crisis` | Latest crisis state |
| `GET`  | `/api/logs` | All agent traces |
| `GET`  | `/api/simulation` | Before/after results |
| `GET`  | `/api/map` | Map markers & routes |

---

## 🎯 Demo Scenario

**Location**: G-10, Islamabad, Pakistan  
**Crisis Type**: Urban Flooding — Flash Flood, Road Inundation  
**Signals**: 8 inputs (3 social, 2 weather, 2 traffic, 1 complaint)  
**Confidence**: 92%  
**Severity**: HIGH  

**Outcome after agent execution**:
- Congestion reduced: **87% → 38%** (56% reduction)
- Vehicles cleared: **245** of 340 stranded
- Alternate routes activated: **3**
- Alerts sent: **5 channels** (45,000+ reach)
- Emergency units deployed: **5**

---

## 🔑 Antigravity Orchestration Features

✅ Multiple agents with distinct roles  
✅ Sequential workflow execution with planning  
✅ Condition-based step skipping  
✅ Full trace logging per agent per step  
✅ State propagation between agents  
✅ Simulation with before/after comparison  
✅ Ticket generation for all actions  
✅ Mobile app visualization of all traces  
