const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const orchestrator = require('./agents/orchestrator');
const traceStore = require('./agents/traceStore');
const mockData = require('./data/mockData');

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
//  POST /api/ingest  – submit crisis signals
// ─────────────────────────────────────────────
app.post('/api/ingest', async (req, res) => {
  const { signals } = req.body;
  const sessionId = uuidv4();
  traceStore.clear(sessionId);

  try {
    const result = await orchestrator.run(sessionId, signals || mockData.defaultSignals);
    res.json({ success: true, sessionId, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
//  GET /api/crisis  – latest crisis state
// ─────────────────────────────────────────────
app.get('/api/crisis', (req, res) => {
  res.json(traceStore.getLatestCrisis());
});

// ─────────────────────────────────────────────
//  GET /api/logs  – full agent trace log
// ─────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
  res.json({ logs: traceStore.getAllLogs() });
});

// ─────────────────────────────────────────────
//  GET /api/simulation  – simulation results
// ─────────────────────────────────────────────
app.get('/api/simulation', (req, res) => {
  res.json(traceStore.getSimulationResult());
});

// ─────────────────────────────────────────────
//  GET /api/map  – map markers & routes
// ─────────────────────────────────────────────
app.get('/api/map', (req, res) => {
  res.json(traceStore.getMapData());
});

// ─────────────────────────────────────────────
//  POST /api/demo  – run full demo pipeline
// ─────────────────────────────────────────────
app.post('/api/demo', async (req, res) => {
  const sessionId = uuidv4();
  traceStore.clear(sessionId);

  try {
    const result = await orchestrator.run(sessionId, mockData.defaultSignals);
    res.json({
      success: true,
      sessionId,
      crisis: traceStore.getLatestCrisis(),
      logs: traceStore.getAllLogs(),
      simulation: traceStore.getSimulationResult(),
      map: traceStore.getMapData(),
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚨 CIRO Backend running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints: /api/ingest  /api/crisis  /api/logs  /api/simulation  /api/map  /api/demo\n`);
});
