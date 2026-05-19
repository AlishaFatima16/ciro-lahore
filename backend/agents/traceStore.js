/**
 * traceStore.js
 * Central in-memory store for all agent traces, crisis data, simulation results.
 * Acts as the Antigravity-visible state log.
 */

let logs = [];
let latestCrisis = null;
let simulationResult = null;
let mapData = null;
let currentSessionId = null;

function clear(sessionId) {
  logs = [];
  latestCrisis = null;
  simulationResult = null;
  mapData = null;
  currentSessionId = sessionId;
}

function addLog(entry) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  const log = { id: logs.length + 1, timestamp, ...entry };
  logs.push(log);
  console.log(`[${timestamp}] [${entry.agent}] ${entry.message}`);
  return log;
}

function setLatestCrisis(crisis) {
  latestCrisis = crisis;
}

function setSimulationResult(result) {
  simulationResult = result;
}

function setMapData(data) {
  mapData = data;
}

function getAllLogs() {
  return logs;
}

function getLatestCrisis() {
  return latestCrisis || defaultCrisisState();
}

function getSimulationResult() {
  return simulationResult || defaultSimulation();
}

function getMapData() {
  return mapData || defaultMap();
}

function defaultCrisisState() {
  return {
    detected: false,
    type: 'No active crisis',
    severity: 'NONE',
    confidence: 0,
    location: 'N/A',
    weather: { condition: 'Clear', rainfall: '0mm', windSpeed: '10 km/h' },
    traffic: { congestionLevel: 'Low', affectedRoads: [] }
  };
}

function defaultSimulation() {
  return {
    executed: false,
    before: { congestion: 'N/A', responseTime: 'N/A', alertsSent: 0 },
    after: { congestion: 'N/A', responseTime: 'N/A', alertsSent: 0 },
    actions: [],
    tickets: []
  };
}

function defaultMap() {
  return {
    center: { latitude: 33.6844, longitude: 73.0479 },
    blockedRoutes: [],
    alternateRoutes: [],
    emergencyMarkers: []
  };
}

module.exports = {
  clear, addLog, setLatestCrisis, setSimulationResult, setMapData,
  getAllLogs, getLatestCrisis, getSimulationResult, getMapData
};
