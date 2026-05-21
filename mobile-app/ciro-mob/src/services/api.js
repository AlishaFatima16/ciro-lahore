/**
 * api.js — CIRO Centralised FastAPI axios Service
 * ───────────────────────────────────────────────
 */

import axios from 'axios';
import { Platform } from 'react-native';

// Use local machine IP if running on physical device,
// otherwise map localhost (Web) // Physical Device IP (Must be on same WiFi as this PC)
const ANDROID_API_URL = 'https://ciro-backend-636075247628.us-central1.run.app';
const WEB_API_URL = 'http://localhost:8000';

export const BASE_URL = Platform.OS === 'android' ? ANDROID_API_URL : WEB_API_URL;

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
  // Keeping this for compatibility, though we use simulation status mostly
  return api.get('/simulation/status');
};

export default api;
