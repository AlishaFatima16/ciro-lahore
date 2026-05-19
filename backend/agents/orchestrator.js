/**
 * orchestrator.js
 * CIRO Master Orchestrator — powered by Antigravity-style agent coordination.
 * Runs agents sequentially, collects traces, builds full crisis response workflow.
 */

const traceStore = require('./traceStore');
const eventDetectionAgent = require('./eventDetectionAgent');
const reasoningAgent = require('./reasoningAgent');
const actionPlanningAgent = require('./actionPlanningAgent');
const simulationAgent = require('./simulationAgent');

async function run(sessionId, signals) {
  traceStore.addLog({
    agent: 'ORCHESTRATOR',
    type: 'WORKFLOW_START',
    message: `🚀 CIRO Orchestration started. Session: ${sessionId}`,
    level: 'info',
    data: { signalCount: signals.length }
  });

  await delay(300);

  // ── AGENT 1: Event Detection ──────────────────────────
  traceStore.addLog({
    agent: 'ORCHESTRATOR',
    type: 'AGENT_INVOKE',
    message: '📡 Invoking EventDetectionAgent...',
    level: 'info'
  });

  const detectionResult = await eventDetectionAgent.run(sessionId, signals);

  // ── AGENT 2: Reasoning ────────────────────────────────
  traceStore.addLog({
    agent: 'ORCHESTRATOR',
    type: 'AGENT_INVOKE',
    message: '🧠 Invoking ReasoningAgent...',
    level: 'info'
  });

  const reasoningResult = await reasoningAgent.run(sessionId, detectionResult, signals);

  // ── AGENT 3: Action Planning ──────────────────────────
  traceStore.addLog({
    agent: 'ORCHESTRATOR',
    type: 'AGENT_INVOKE',
    message: '📋 Invoking ActionPlanningAgent...',
    level: 'info'
  });

  const actionPlan = await actionPlanningAgent.run(sessionId, reasoningResult);

  // ── AGENT 4: Simulation ───────────────────────────────
  traceStore.addLog({
    agent: 'ORCHESTRATOR',
    type: 'AGENT_INVOKE',
    message: '⚡ Invoking SimulationAgent...',
    level: 'info'
  });

  const simulationResult = await simulationAgent.run(sessionId, actionPlan);

  // ── FINAL TRACE ───────────────────────────────────────
  traceStore.addLog({
    agent: 'ORCHESTRATOR',
    type: 'WORKFLOW_COMPLETE',
    message: `✅ CIRO Orchestration complete. ${traceStore.getAllLogs().length} trace events generated.`,
    level: 'success',
    data: {
      crisis: reasoningResult.crisis.type,
      severity: reasoningResult.crisis.severity,
      actionsExecuted: simulationResult.actions.length
    }
  });

  return {
    detection: detectionResult,
    reasoning: reasoningResult,
    actionPlan,
    simulation: simulationResult
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { run };
