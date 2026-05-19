/**
 * api.js — CIRO Centralised FastAPI axios Service
 * ───────────────────────────────────────────────
 */

import axios from 'axios';
import { Platform } from 'react-native';

// Use local machine IP if running on physical device,
// otherwise map localhost (Web) / 10.0.2.2 (Android Emulator).
export const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : 'http://10.0.2.2:8000';

console.log(`[CIRO API] Configured Base URL: ${BASE_URL}`);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request Interceptor for logging
api.interceptors.request.use(config => {
  console.log(`[CIRO API] → ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response Interceptor for debugging
api.interceptors.response.use(
  res => res,
  err => {
    console.warn(`[CIRO API] ✗ Call failed: ${err.message}`);
    return Promise.reject(err);
  }
);

// ── EXPECTED BACKEND ENDPOINTS ─────────────────────────────────

/** Ingest signal custom text and correlation risk flags */
export const ingestSignals = (payload) => {
  // payload structure: { signal: string, floodRisk: bool, smokeDetected: bool, powerOutage: bool }
  return api.post('/signals/ingest', payload);
};

/** Retrieve live status breakdown of current crisis */
export const getCrisis = () => {
  return api.get('/crisis/current');
};

/** Retrieve step-by-step logs and tool calls from Antigravity swarm */
export const getLogs = () => {
  return api.get('/agents/traces');
};

/** Retrieve simulated or actual execution before/after metrics */
export const getSimulation = () => {
  return api.get('/simulation/status');
};

/** Retrieve Lahore satellite coordinate layers, routes, and dispatch pins */
export const getMap = () => {
  return api.get('/map/zones');
};

/** Retrieve live municipal dispatch statuses for WASA, Rescue 1122 and SMS boards */
export const getOutcomeState = () => {
  return api.get('/outcome/state');
};

export default api;
