/**
 * simulationAgent.js
 * CIRO Agent #4 — Simulation & Execution
 * Simulates execution of the action plan:
 * - traffic rerouting
 * - emergency dispatch
 * - alert sending
 * - ticket generation
 * - system state updates
 * Generates before/after comparison.
 */

const traceStore = require('./traceStore');
const { v4: uuidv4 } = require('uuid');

async function run(sessionId, actionPlan) {
  const { reroutingPlan, dispatchPlan, alertPlan, crisis } = actionPlan;

  traceStore.addLog({
    agent: 'SIMULATION',
    type: 'START',
    message: `⚡ SimulationAgent activated — executing ${reroutingPlan.closures.length + dispatchPlan.units.length + alertPlan.channels.length} coordinated actions...`,
    level: 'info'
  });

  await delay(200);

  // ── Before State ──────────────────────────────────────
  const beforeState = {
    congestion: '87%',
    avgSpeed: '4 km/h',
    responseTime: 'N/A',
    alertsSent: 0,
    roadsBlocked: 2,
    vehiclesStranded: 340,
    citizensAtRisk: 12400,
    systemStatus: 'CRISIS_UNMANAGED'
  };

  traceStore.addLog({
    agent: 'SIMULATION',
    type: 'BEFORE_STATE',
    message: `📊 PRE-RESPONSE STATE: Congestion ${beforeState.congestion}, ${beforeState.vehiclesStranded} vehicles stranded, ${beforeState.alertsSent} alerts sent`,
    level: 'warning',
    data: beforeState
  });

  await delay(300);

  const actions = [];
  const tickets = [];

  // ── Action 1: Activate Road Closures ──────────────────
  for (const closure of reroutingPlan.closures) {
    await delay(100);
    const ticket = generateTicket('ROAD_CLOSURE', closure);
    tickets.push(ticket);
    actions.push({ type: 'ROAD_CLOSURE', status: 'EXECUTED', detail: closure.road, ticketId: ticket.id });
    traceStore.addLog({
      agent: 'SIMULATION',
      type: 'ACTION_EXECUTE',
      message: `🚧 Road closure activated: ${closure.road} [${closure.severity}] — Ticket: ${ticket.id}`,
      level: 'warning',
      data: { closure, ticket }
    });
  }

  // ── Action 2: Activate Alternate Routes ───────────────
  for (const route of reroutingPlan.alternateRoutes) {
    await delay(100);
    actions.push({ type: 'ROUTE_ACTIVATE', status: 'EXECUTED', detail: route.via, delay: route.estimatedDelay });
    traceStore.addLog({
      agent: 'SIMULATION',
      type: 'ACTION_EXECUTE',
      message: `🔀 Alternate route activated: ${route.via} → Est. delay ${route.estimatedDelay}`,
      level: 'info'
    });
  }

  // ── Action 3: Dispatch Emergency Units ────────────────
  for (const unit of dispatchPlan.units) {
    await delay(120);
    const ticket = generateTicket('DISPATCH', unit);
    tickets.push(ticket);
    actions.push({ type: 'EMERGENCY_DISPATCH', status: unit.status, detail: `${unit.type} — ${unit.id}`, eta: unit.eta, ticketId: ticket.id });
    traceStore.addLog({
      agent: 'SIMULATION',
      type: 'ACTION_EXECUTE',
      message: `🚨 ${unit.type} dispatched: ${unit.id} from ${unit.location} — ETA: ${unit.eta} — Ticket: ${ticket.id}`,
      level: 'critical',
      data: unit
    });
  }

  // ── Action 4: Send Alerts ─────────────────────────────
  let alertsSent = 0;
  for (const alert of alertPlan.channels) {
    await delay(80);
    alertsSent++;
    const ticket = generateTicket('ALERT', alert);
    tickets.push(ticket);
    actions.push({ type: 'ALERT_SENT', status: 'SENT', detail: `${alert.type} → ${alert.target}`, ticketId: ticket.id });
    traceStore.addLog({
      agent: 'SIMULATION',
      type: 'ACTION_EXECUTE',
      message: `📢 Alert sent via ${alert.type}: "${alert.message.substring(0, 60)}..." — Ticket: ${ticket.id}`,
      level: 'info',
      data: alert
    });
  }

  // ── Signal Override ────────────────────────────────────
  for (const override of reroutingPlan.signalOverrides) {
    await delay(80);
    actions.push({ type: 'SIGNAL_OVERRIDE', status: 'EXECUTED', detail: override });
    traceStore.addLog({
      agent: 'SIMULATION',
      type: 'ACTION_EXECUTE',
      message: `🚦 Traffic signal override: ${override}`,
      level: 'info'
    });
  }

  await delay(300);

  // ── After State ───────────────────────────────────────
  const afterState = {
    congestion: '38%',
    avgSpeed: '34 km/h',
    responseTime: '8 min avg',
    alertsSent,
    roadsBlocked: 2,
    alternateRoutesActive: reroutingPlan.alternateRoutes.length,
    vehiclesStranded: 95,
    citizensAlerted: 45000,
    systemStatus: 'CRISIS_MANAGED',
    congestionReduction: '56%',
    speedImprovement: '750%',
    rescueUnitsOnSite: dispatchPlan.units.filter(u => u.status !== 'ON_STANDBY').length
  };

  traceStore.addLog({
    agent: 'SIMULATION',
    type: 'AFTER_STATE',
    message: `📊 POST-RESPONSE STATE: Congestion reduced to ${afterState.congestion}, Avg speed ${afterState.avgSpeed}, ${alertsSent} alerts sent, ${afterState.rescueUnitsOnSite} rescue units on-site`,
    level: 'success',
    data: afterState
  });

  // ── Outcome Summary ────────────────────────────────────
  const summary = {
    congestionReduced: '56%',
    vehiclesCleared: beforeState.vehiclesStranded - afterState.vehiclesStranded,
    alertsSent: alertsSent,
    ticketsGenerated: tickets.length,
    actionsExecuted: actions.length,
    estimatedLivesProtected: 240,
    responseTimeAchieved: '8 min',
    systemUptime: '99.8%'
  };

  const simulationResult = {
    executed: true,
    sessionId,
    before: beforeState,
    after: afterState,
    actions,
    tickets,
    summary,
    timeline: generateTimeline(actions)
  };

  traceStore.setSimulationResult(simulationResult);

  traceStore.addLog({
    agent: 'SIMULATION',
    type: 'COMPLETE',
    message: `✅ SimulationAgent complete — ${actions.length} actions, ${tickets.length} tickets, ${alertsSent} alerts. Congestion reduced by ${summary.congestionReduced}.`,
    level: 'success',
    data: summary
  });

  return simulationResult;
}

function generateTicket(type, data) {
  const prefix = type === 'ROAD_CLOSURE' ? 'RC' : type === 'DISPATCH' ? 'ED' : 'AL';
  return {
    id: `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`,
    type,
    status: 'OPEN',
    priority: type === 'DISPATCH' ? 'P1' : 'P2',
    createdAt: new Date().toISOString(),
    data
  };
}

function generateTimeline(actions) {
  const base = Date.now() - actions.length * 60000;
  return actions.map((action, i) => ({
    time: new Date(base + i * 60000).toLocaleTimeString('en-US', { hour12: false }),
    event: `${action.type}: ${action.detail}`,
    status: action.status
  }));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { run };
