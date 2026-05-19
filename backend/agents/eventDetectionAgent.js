/**
 * eventDetectionAgent.js
 * CIRO Agent #1 — Event Detection
 * Ingests multi-source signals, detects anomalies, clusters events,
 * estimates initial severity score.
 */

const traceStore = require('./traceStore');

const FLOOD_KEYWORDS = ['pani', 'flood', 'bhar gaya', 'water', 'submerged', 'inundated', 'overflow', 'stranded'];
const TRAFFIC_KEYWORDS = ['traffic', 'jam', 'blocked', 'vehicles', 'congestion', 'road', 'standstill', 'reroute'];
const WEATHER_KEYWORDS = ['rainfall', 'rain', 'storm', 'heavy', 'alert', 'warning', 'downpour'];
const EMERGENCY_KEYWORDS = ['emergency', 'help', 'rescue', 'trapped', 'injured', 'fire', 'accident'];

async function run(sessionId, signals) {
  traceStore.addLog({
    agent: 'EVENT_DETECTION',
    type: 'START',
    message: `📥 Receiving ${signals.length} multi-source signals for analysis...`,
    level: 'info'
  });

  await delay(200);

  // ── Step 1: Signal Classification ─────────────────────
  const classified = signals.map(signal => classifySignal(signal));

  traceStore.addLog({
    agent: 'EVENT_DETECTION',
    type: 'SIGNAL_CLASSIFY',
    message: `🔍 Signals classified → Social: ${count(classified, 'social')}, Weather: ${count(classified, 'weather')}, Traffic: ${count(classified, 'traffic')}, Emergency: ${count(classified, 'emergency')}`,
    level: 'info',
    data: classified
  });

  await delay(200);

  // ── Step 2: Anomaly Detection ──────────────────────────
  const floodSignals = classified.filter(s => s.tags.includes('flood'));
  const trafficSignals = classified.filter(s => s.tags.includes('traffic'));
  const weatherSignals = classified.filter(s => s.tags.includes('weather'));

  traceStore.addLog({
    agent: 'EVENT_DETECTION',
    type: 'ANOMALY_DETECT',
    message: `⚠️ Anomaly detected — Flood signals: ${floodSignals.length}, Traffic signals: ${trafficSignals.length}, Weather alerts: ${weatherSignals.length}`,
    level: 'warning'
  });

  await delay(150);

  // ── Step 3: Event Clustering ───────────────────────────
  const clusters = clusterEvents(classified);

  traceStore.addLog({
    agent: 'EVENT_DETECTION',
    type: 'CLUSTER',
    message: `🔗 Event clustering complete — ${clusters.length} distinct crisis cluster(s) identified`,
    level: 'info',
    data: clusters
  });

  await delay(150);

  // ── Step 4: Severity Estimation ────────────────────────
  const severity = estimateSeverity(clusters, floodSignals, trafficSignals, weatherSignals);

  traceStore.addLog({
    agent: 'EVENT_DETECTION',
    type: 'SEVERITY',
    message: `🚨 Initial severity estimated: ${severity.level} (score: ${severity.score}/100)`,
    level: severity.score > 70 ? 'critical' : 'warning',
    data: severity
  });

  traceStore.addLog({
    agent: 'EVENT_DETECTION',
    type: 'COMPLETE',
    message: `✅ EventDetectionAgent complete. Crisis type: "${severity.crisisType}" at ${severity.location}`,
    level: 'success'
  });

  return {
    classified,
    clusters,
    severity,
    floodSignals: floodSignals.length,
    trafficSignals: trafficSignals.length,
    weatherSignals: weatherSignals.length
  };
}

function classifySignal(signal) {
  const text = (signal.text || signal.message || '').toLowerCase();
  const tags = [];

  if (FLOOD_KEYWORDS.some(k => text.includes(k))) tags.push('flood');
  if (TRAFFIC_KEYWORDS.some(k => text.includes(k))) tags.push('traffic');
  if (WEATHER_KEYWORDS.some(k => text.includes(k))) tags.push('weather');
  if (EMERGENCY_KEYWORDS.some(k => text.includes(k))) tags.push('emergency');

  return {
    source: signal.source || 'unknown',
    text: signal.text || signal.message,
    tags: tags.length ? tags : ['general'],
    timestamp: signal.timestamp || new Date().toISOString(),
    location: signal.location || 'G-10, Islamabad'
  };
}

function clusterEvents(classified) {
  const clusters = [];
  const floodGroup = classified.filter(s => s.tags.includes('flood'));
  const trafficGroup = classified.filter(s => s.tags.includes('traffic'));
  const weatherGroup = classified.filter(s => s.tags.includes('weather'));

  if (floodGroup.length > 0) clusters.push({ type: 'FLOOD_EVENT', signals: floodGroup, location: 'G-10, Islamabad' });
  if (trafficGroup.length > 0) clusters.push({ type: 'TRAFFIC_DISRUPTION', signals: trafficGroup, location: 'G-10 Main Road' });
  if (weatherGroup.length > 0) clusters.push({ type: 'WEATHER_ALERT', signals: weatherGroup, location: 'Greater Islamabad' });

  return clusters;
}

function estimateSeverity(clusters, floodSigs, trafficSigs, weatherSigs) {
  let score = 0;
  score += floodSigs.length * 25;
  score += trafficSigs.length * 15;
  score += weatherSigs.length * 20;
  score = Math.min(score, 100);

  let level = 'LOW';
  if (score >= 75) level = 'CRITICAL';
  else if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MODERATE';

  return {
    score,
    level,
    crisisType: floodSigs.length > 0 ? 'Urban Flooding' : trafficSigs.length > 0 ? 'Traffic Disruption' : 'Weather Event',
    location: 'G-10, Islamabad',
    affectedArea: '3.2 km radius',
    estimatedAffected: score > 50 ? '12,000+ residents' : '2,000+ residents'
  };
}

function count(arr, source) {
  return arr.filter(s => s.source === source || s.tags.includes(source)).length;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { run };
