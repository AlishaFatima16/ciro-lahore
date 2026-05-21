# ⚡ CIRO - Crisis Intelligence & Response Orchestrator (Lahore)

**An autonomous AI Agent Swarm that detects, analyzes, and mitigates urban crises in real-time.**

CIRO (Crisis Intelligence & Response Orchestrator) is a cutting-edge platform designed to revolutionize municipal emergency response in Lahore. By leveraging a swarm of highly specialized AI agents, CIRO continuously monitors social feeds and environmental sensors to detect emergencies like **Urban Flooding** and **Hazardous Smog** faster than traditional 911/1122 pipelines.

Once an anomaly is detected, the Antigravity Swarm autonomously analyzes traffic telemetry, generates alternate routing, and dispatches emergency units (WASA, Rescue 1122, EPA) with zero human intervention.

---

## 🌐 Live Production Deployments

For final judging and immediate testing, CIRO is fully deployed and production-ready:

* **🚀 Production Cloud Backend (GCP Cloud Run):** [https://ciro-backend-636075247628.us-central1.run.app](https://ciro-backend-636075247628.us-central1.run.app)
  * *Containerized via Docker and deployed securely with full auto-scaling support.*
* **💾 Persistent Database (Neon PostgreSQL Cloud):** Linked to the GCP backend to ensure all swarm agent logs, active simulations, and coordinate maps survive scale-to-zero boots.
* **📱 Standalone Mobile APK (Android Preview Build):** **[Download Android APK (sSRtsUXiHNQ8MB1abH9wRR.apk)](https://expo.dev/artifacts/eas/sSRtsUXiHNQ8MB1abH9wRR.apk)**
  * *EAS-compiled standalone preview build pre-configured to talk directly to our production Cloud Run endpoints.*

---

## 🌟 Key Features

* **🧠 Autonomous AI Agent Swarm:** Built on a multi-agent framework where specialized AI agents (Signal Detection, Weather Correlation, Traffic Analysis, Response Planning, and Emergency Dispatch) communicate and solve crises collaboratively.
* **📱 Tactical Command Center:** A premium, cyberpunk-inspired React Native mobile dashboard for municipal commanders to monitor live telemetry, agent logs, and crisis metrics.
* **🗺️ Geospatial Intelligence:** Fully integrated Leaflet maps displaying blocked arterials, submerged underpasses, and dynamically generated alternate bypass routes in neon contrast.
* **🚦 Intelligent Rerouting:** Automatically identifies traffic gridlocks and calculates bypass corridors (e.g., diverting traffic from flooded Liberty Underpass to Kalma Chowk).
* **🚒 Automated API Dispatch:** Mocks live API handshakes to instantly dispatch WASA drainage pumps, EPA Air Scrubbers, and Rescue 1122 medical swarms.

---

## 🛠️ Architecture & Tech Stack

CIRO is separated into a high-performance Python Swarm Backend and a reactive Mobile Frontend.

### 1. The Antigravity Swarm Backend (Python / FastAPI)
* **Framework:** FastAPI
* **Architecture:** Agentic Pipeline (Orchestrator pattern)
* **Data Layer:** SQLite & SQLAlchemy (Logs, Executions, Plans)
* **Capabilities:** Synchronous/Asynchronous pipeline execution, tool invocation, and dynamic JSON endpoint delivery.

### 2. The Command EOC Frontend (React Native / Expo)
* **Framework:** React Native & Expo
* **Routing:** React Navigation (Bottom Tabs)
* **Map Engine:** Leaflet via WebView (`react-native-webview`) with custom CartoDB Dark Matter tile layers and localized Urdu markers.
* **State Management:** Custom React Context (`CrisisContext.js`) with intelligent offline fallbacks and hot-swappable polling.

---

## 🚀 Running CIRO Locally

To run the full stack locally on your machine, you will need two terminal windows.

### Step 1: Start the AI Backend
In your first terminal, navigate to the `backend` directory and start the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*(Note: Binding to `0.0.0.0` allows your physical mobile device to connect over the local network).*

### Step 2: Start the Mobile Dashboard
In your second terminal, navigate to the `mobile-app/ciro-mob` directory and start the Expo Metro bundler:
```bash
cd mobile-app/ciro-mob
npm install
npm start
```

### Step 3: Connect
* Ensure your mobile phone and laptop are on the same WiFi network.
* Open the **Expo Go** app on your iOS or Android device.
* Scan the QR code generated in Terminal 2.
* Tap **"Trigger New"** on the Simulation tab to initiate an autonomous swarm sequence!

---

## 🧪 The "Under the Hood" Fallback Engine
CIRO is built with resilience in mind. If the FastAPI backend ever goes offline or network connectivity is lost, the React Native frontend automatically intercepts the timeout and gracefully degrades into a **Local Offline Fallback Mode**. It streams identical high-fidelity telemetry from a localized JSON engine, ensuring city commanders always have access to critical structural data regardless of cloud stability.

---

## 🏆 Built For the Hackathon
This project was built to demonstrate the raw power of Multi-Agent AI Systems in civic infrastructure. By removing the human bottleneck in emergency verification and dispatch, CIRO proves that a proactive, swarm-based intelligence grid can actively save lives and protect urban environments.
