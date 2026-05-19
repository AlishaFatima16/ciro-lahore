/**
 * actionPlanningAgent.js
 * CIRO Agent #3 — Action Planning
 * Takes reasoned crisis model and generates coordinated response plan:
 * route rerouting, emergency dispatch, public alerts, road closures.
 */

const traceStore = require('./traceStore');

async function run(sessionId, reasoningResult) {
  const { crisis, trafficData } = reasoningResult;

  traceStore.addLog({
    agent: 'ACTION_PLANNING',
    type: 'START',
    message: `📋 ActionPlanningAgent activated for ${crisis.type} at ${crisis.location}`,
    level: 'info'
  });

  await delay(200);

  // ── Step 1: Route Rerouting Plan ──────────────────────
  const reroutingPlan = planRerouting(crisis, trafficData);
  traceStore.addLog({
    agent: 'ACTION_PLANNING',
    type: 'REROUTING',
    message: `🔀 Rerouting plan generated: ${reroutingPlan.alternateRoutes.length} alternate routes, ${reroutingPlan.closures.length} road closures`,
    level: 'info',
    data: reroutingPlan
  });

  await delay(200);

  // ── Step 2: Emergency Dispatch Plan ───────────────────
  const dispatchPlan = planEmergencyDispatch(crisis);
  traceStore.addLog({
    agent: 'ACTION_PLANNING',
    type: 'DISPATCH',
    message: `🚑 Emergency dispatch plan: ${dispatchPlan.units.length} units deployed (${dispatchPlan.types.join(', ')})`,
    level: 'critical',
    data: dispatchPlan
  });

  await delay(150);

  // ── Step 3: Alert Plan ─────────────────────────────────
  const alertPlan = planAlerts(crisis);
  traceStore.addLog({
    agent: 'ACTION_PLANNING',
    type: 'ALERTS',
    message: `📢 Alert plan: ${alertPlan.channels.length} channels, estimated reach: ${alertPlan.estimatedReach}`,
    level: 'warning',
    data: alertPlan
  });

  await delay(150);

  // ── Step 4: Resource Allocation ────────────────────────
  const resources = allocateResources(crisis);
  traceStore.addLog({
    agent: 'ACTION_PLANNING',
    type: 'RESOURCES',
    message: `🏗️ Resources allocated: ${resources.total} total units (pumps, boats, personnel)`,
    level: 'info',
    data: resources
  });

  await delay(100);

  // ── Store map data ─────────────────────────────────────
  const mapData = buildMapData(crisis, reroutingPlan, dispatchPlan);
  traceStore.setMapData(mapData);

  traceStore.addLog({
    agent: 'ACTION_PLANNING',
    type: 'COMPLETE',
    message: `✅ ActionPlanningAgent complete — Full response plan ready with ${reroutingPlan.alternateRoutes.length + dispatchPlan.units.length + alertPlan.channels.length} coordinated actions`,
    level: 'success'
  });

  return { reroutingPlan, dispatchPlan, alertPlan, resources, mapData, crisis };
}

function planRerouting(crisis, trafficData) {
  return {
    closures: [
      { road: 'G-10 Main Boulevard (Underpass)', reason: 'Flooded', severity: 'FULL_CLOSURE' },
      { road: 'PWD Road G-10 Section 3', reason: 'Water logging', severity: 'PARTIAL_CLOSURE' }
    ],
    alternateRoutes: [
      { from: 'G-10 Entry', to: 'G-11 Bypass', via: 'Margalla Road', estimatedDelay: '12 min', status: 'ACTIVE' },
      { from: 'G-10 Markaz', to: 'F-8', via: '9th Avenue', estimatedDelay: '18 min', status: 'ACTIVE' },
      { from: 'G-10 South', to: 'G-9', via: 'Khayaban-e-Suharwardy', estimatedDelay: '8 min', status: 'ACTIVE' }
    ],
    signalOverrides: ['G-10/1 Junction — GREEN extended to 90s', 'G-10/3 Junction — Emergency routing mode'],
    estimatedRelief: '45% congestion reduction in 30 minutes'
  };
}

function planEmergencyDispatch(crisis) {
  const units = [
    { id: 'RES-01', type: 'Rescue Team', location: 'G-10/1', status: 'DISPATCHED', eta: '8 min', personnel: 6 },
    { id: 'AMB-03', type: 'Ambulance', location: 'PIMS Hospital', status: 'DISPATCHED', eta: '12 min', personnel: 3 },
    { id: 'PUMP-02', type: 'Flood Pump Unit', location: 'G-9 Depot', status: 'DISPATCHED', eta: '15 min', personnel: 4 },
    { id: 'POL-07', type: 'Police Unit', location: 'G-10 Station', status: 'DISPATCHED', eta: '5 min', personnel: 8 },
    { id: 'BOAT-01', type: 'Rescue Boat', location: 'F-6 Base', status: 'ON_STANDBY', eta: '20 min', personnel: 3 }
  ];
  return {
    units,
    types: [...new Set(units.map(u => u.type))],
    totalPersonnel: units.reduce((sum, u) => sum + u.personnel, 0),
    commandCenter: 'NDMA Islamabad HQ',
    coordinationFrequency: '156.800 MHz'
  };
}

function planAlerts(crisis) {
  return {
    channels: [
      { type: 'SMS_BLAST', target: 'G-10 residents (12,400)', status: 'QUEUED', message: '⚠️ FLOOD ALERT: G-10 area flooding. Avoid G-10 Main Road. Move to higher ground.' },
      { type: 'PUSH_NOTIFICATION', target: 'CIRO App users', status: 'QUEUED', message: '🚨 Flash flood detected at G-10, Islamabad' },
      { type: 'RADIO_BROADCAST', target: 'FM 101.6 Metro Radio', status: 'QUEUED', message: 'Emergency announcement: G-10 road closures in effect' },
      { type: 'WAZE_API', target: 'Navigation Apps', status: 'QUEUED', message: 'Incident reported: Flooding on G-10 Main Blvd' },
      { type: 'EMAIL_AUTHORITY', target: 'CDA, NDMA, MCI', status: 'QUEUED', message: 'CIRO Crisis Alert — Action Required' }
    ],
    estimatedReach: '45,000+ people',
    priority: 'P1 — CRITICAL'
  };
}

function allocateResources(crisis) {
  const items = [
    { type: 'Water Pump', quantity: 4, status: 'ALLOCATED' },
    { type: 'Rescue Boat', quantity: 2, status: 'ALLOCATED' },
    { type: 'Emergency Personnel', quantity: 24, status: 'ALLOCATED' },
    { type: 'Sandbag Units', quantity: 500, status: 'ALLOCATED' },
    { type: 'Medical Kits', quantity: 20, status: 'ALLOCATED' },
    { type: 'Generator Sets', quantity: 3, status: 'ALLOCATED' }
  ];
  return { items, total: items.reduce((s, i) => s + i.quantity, 0) };
}

function buildMapData(crisis, reroutingPlan, dispatchPlan) {
  return {
    center: { latitude: 33.6844, longitude: 73.0479 },
    zoom: 14,
    blockedRoutes: [
      { id: 'BR-1', name: 'G-10 Main Boulevard', coordinates: [{ latitude: 33.6844, longitude: 73.0479 }, { latitude: 33.6860, longitude: 73.0510 }], severity: 'FULL_CLOSURE', color: '#FF3B30' },
      { id: 'BR-2', name: 'PWD Road G-10', coordinates: [{ latitude: 33.6820, longitude: 73.0460 }, { latitude: 33.6835, longitude: 73.0480 }], severity: 'PARTIAL_CLOSURE', color: '#FF9500' }
    ],
    alternateRoutes: [
      { id: 'AR-1', name: 'Margalla Road Bypass', coordinates: [{ latitude: 33.6900, longitude: 73.0400 }, { latitude: 33.6950, longitude: 73.0550 }], status: 'ACTIVE', color: '#34C759' },
      { id: 'AR-2', name: '9th Avenue Route', coordinates: [{ latitude: 33.6800, longitude: 73.0550 }, { latitude: 33.6750, longitude: 73.0650 }], status: 'ACTIVE', color: '#30D158' }
    ],
    emergencyMarkers: [
      { id: 'EM-1', type: 'FLOOD_ZONE', title: 'Active Flood Zone', coordinate: { latitude: 33.6844, longitude: 73.0479 }, icon: '🌊' },
      { id: 'EM-2', type: 'RESCUE', title: 'RES-01 Rescue Team', coordinate: { latitude: 33.6855, longitude: 73.0495 }, icon: '🚒', status: 'DISPATCHED' },
      { id: 'EM-3', type: 'MEDICAL', title: 'AMB-03 Ambulance', coordinate: { latitude: 33.6830, longitude: 73.0460 }, icon: '🚑', status: 'EN_ROUTE' },
      { id: 'EM-4', type: 'PUMP', title: 'PUMP-02 Flood Pump', coordinate: { latitude: 33.6860, longitude: 73.0510 }, icon: '💧', status: 'DISPATCHED' },
      { id: 'EM-5', type: 'POLICE', title: 'POL-07 Traffic Control', coordinate: { latitude: 33.6838, longitude: 73.0484 }, icon: '🚔', status: 'ON_SITE' }
    ]
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { run };
