/**
 * reasoningAgent.js
 * CIRO Agent #2 — Reasoning & Confidence Estimation
 * Combines weather + traffic + social signals,
 * builds a structured crisis model with confidence scoring and explanation.
 */

const traceStore = require('./traceStore');

async function run(sessionId, detectionResult, rawSignals) {
  traceStore.addLog({
    agent: 'REASONING',
    type: 'START',
    message: `🧠 ReasoningAgent activated — analyzing ${detectionResult.clusters.length} clusters...`,
    level: 'info'
  });

  await delay(200);

  // ── Step 1: Weather Signal Analysis ───────────────────
  const weatherData = extractWeatherData(rawSignals);
  traceStore.addLog({
    agent: 'REASONING',
    type: 'WEATHER_ANALYSIS',
    message: `🌧️ Weather analysis: ${weatherData.condition}, ${weatherData.rainfall} rainfall, Wind: ${weatherData.windSpeed}`,
    level: 'info',
    data: weatherData
  });

  await delay(150);

  // ── Step 2: Traffic Signal Analysis ───────────────────
  const trafficData = extractTrafficData(rawSignals);
  traceStore.addLog({
    agent: 'REASONING',
    type: 'TRAFFIC_ANALYSIS',
    message: `🚗 Traffic analysis: Congestion ${trafficData.congestionLevel}%, ${trafficData.affectedRoads.length} roads affected`,
    level: 'warning',
    data: trafficData
  });

  await delay(150);

  // ── Step 3: Social Signal Correlation ─────────────────
  const socialSentiment = analyzeSocialSignals(rawSignals);
  traceStore.addLog({
    agent: 'REASONING',
    type: 'SOCIAL_CORRELATION',
    message: `📢 Social signal analysis: ${socialSentiment.reports} reports, Panic level: ${socialSentiment.panicLevel}`,
    level: 'info',
    data: socialSentiment
  });

  await delay(200);

  // ── Step 4: Confidence Scoring ─────────────────────────
  const confidence = computeConfidence(detectionResult, weatherData, trafficData, socialSentiment);
  traceStore.addLog({
    agent: 'REASONING',
    type: 'CONFIDENCE_SCORE',
    message: `📊 Confidence score computed: ${confidence.score}% — ${confidence.verdict}`,
    level: confidence.score > 80 ? 'critical' : 'warning',
    data: confidence
  });

  await delay(150);

  // ── Step 5: Reasoning Explanation ─────────────────────
  const explanation = buildExplanation(detectionResult, weatherData, trafficData, socialSentiment, confidence);
  traceStore.addLog({
    agent: 'REASONING',
    type: 'REASONING_CHAIN',
    message: `🔍 Reasoning chain: ${explanation.summary}`,
    level: 'info',
    data: explanation
  });

  // ── Step 6: Build Crisis Model ─────────────────────────
  const crisis = buildCrisisModel(detectionResult, weatherData, trafficData, socialSentiment, confidence);

  // Store in traceStore for API access
  const traceStore2 = require('./traceStore');
  traceStore2.setLatestCrisis(crisis);

  traceStore.addLog({
    agent: 'REASONING',
    type: 'COMPLETE',
    message: `✅ ReasoningAgent complete — Crisis: "${crisis.type}", Severity: ${crisis.severity}, Confidence: ${crisis.confidence}%`,
    level: 'success'
  });

  return { crisis, weatherData, trafficData, socialSentiment, confidence, explanation };
}

function extractWeatherData(signals) {
  const weatherSigs = signals.filter(s => s.source === 'weather');
  if (weatherSigs.length > 0) {
    return {
      condition: 'Heavy Rainfall',
      rainfall: weatherSigs[0].rainfall || '78mm/hr',
      windSpeed: '45 km/h',
      temperature: '19°C',
      humidity: '92%',
      visibility: 'Low (200m)',
      forecast: 'Continued heavy rain for 4-6 hours'
    };
  }
  return { condition: 'Moderate Rain', rainfall: '32mm/hr', windSpeed: '25 km/h', temperature: '22°C', humidity: '78%', visibility: 'Moderate', forecast: 'Rain expected to subside in 2 hours' };
}

function extractTrafficData(signals) {
  const trafficSigs = signals.filter(s => s.source === 'traffic' || (s.tags && s.tags.includes('traffic')));
  return {
    congestionLevel: trafficSigs.length > 1 ? 87 : 45,
    affectedRoads: ['G-10 Main Boulevard', 'Srinagar Highway Slip Road', 'PWD Road G-10'],
    vehiclesStranded: trafficSigs.length > 1 ? 340 : 80,
    avgSpeed: trafficSigs.length > 1 ? '4 km/h' : '22 km/h',
    peakCongestionZone: 'G-10 Markaz Underpass'
  };
}

function analyzeSocialSignals(signals) {
  const socialSigs = signals.filter(s => s.source === 'social' || s.source === 'complaint');
  return {
    reports: socialSigs.length,
    panicLevel: socialSigs.length > 2 ? 'HIGH' : 'MODERATE',
    topKeywords: ['pani bhar gaya', 'vehicles stranded', 'please help', 'road blocked'],
    locations: ['G-10/1', 'G-10/3', 'G-10 Markaz'],
    engagementScore: socialSigs.length * 120
  };
}

function computeConfidence(detection, weather, traffic, social) {
  let score = 0;
  if (detection.severity.score > 60) score += 40;
  else score += 20;
  if (weather.condition.includes('Heavy')) score += 30;
  else score += 10;
  if (traffic.congestionLevel > 70) score += 20;
  else score += 10;
  if (social.reports > 2) score += 10;
  score = Math.min(score, 97);
  return {
    score,
    verdict: score > 80 ? 'HIGH CONFIDENCE — Immediate action required' : score > 60 ? 'MODERATE CONFIDENCE — Action recommended' : 'LOW CONFIDENCE — Monitor situation',
    breakdown: { detectionWeight: 40, weatherWeight: 30, trafficWeight: 20, socialWeight: 10 }
  };
}

function buildExplanation(detection, weather, traffic, social, confidence) {
  return {
    summary: `Urban flooding confirmed at G-10 with ${confidence.score}% confidence based on ${detection.floodSignals} flood reports, ${weather.rainfall} rainfall, and ${traffic.congestionLevel}% traffic congestion.`,
    steps: [
      `Social media shows ${social.reports} distress reports with keywords: "${social.topKeywords[0]}"`,
      `Weather API confirms ${weather.condition} with ${weather.rainfall} — exceeds 50mm/hr flood threshold`,
      `Traffic sensors report ${traffic.congestionLevel}% congestion on ${traffic.affectedRoads.length} roads`,
      `${traffic.vehiclesStranded} vehicles stranded near G-10 Markaz Underpass`,
      `Combined signal confidence: ${confidence.score}% — ${confidence.verdict}`
    ]
  };
}

function buildCrisisModel(detection, weather, traffic, social, confidence) {
  return {
    detected: true,
    type: 'Urban Flooding',
    subtype: 'Flash Flood — Road Inundation',
    severity: detection.severity.level,
    confidence: confidence.score,
    location: 'G-10, Islamabad',
    coordinates: { latitude: 33.6844, longitude: 73.0479 },
    affectedArea: '3.2 km radius',
    estimatedAffected: detection.severity.estimatedAffected,
    weather: {
      condition: weather.condition,
      rainfall: weather.rainfall,
      windSpeed: weather.windSpeed,
      forecast: weather.forecast
    },
    traffic: {
      congestionLevel: `${traffic.congestionLevel}%`,
      affectedRoads: traffic.affectedRoads,
      vehiclesStranded: traffic.vehiclesStranded
    },
    startedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    detectedAt: new Date().toISOString()
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { run };
