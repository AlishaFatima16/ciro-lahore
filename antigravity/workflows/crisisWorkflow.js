/**
 * crisisWorkflow.js
 * ──────────────────
 * CIRO Antigravity Workflow Definitions.
 * Defines the step-by-step orchestration plans
 * for each crisis type (Flood, Fire, Traffic, etc.)
 */

const workflowDefinitions = {

  // ── PRIMARY: Flood Response Workflow ────────────────────
  FLOOD_RESPONSE: {
    name: 'Urban Flood Response',
    description: 'Full multi-agent crisis response pipeline for urban flooding events',
    version: '1.0.0',
    priority: 'P1_CRITICAL',
    steps: [
      {
        id: 1,
        name: 'Signal Ingestion',
        agent: 'SIGNAL_INGESTION_AGENT',
        task: 'Ingest and normalize multi-source crisis signals',
      },
      {
        id: 2,
        name: 'Event Detection',
        agent: 'EVENT_DETECTION_AGENT',
        task: 'Detect flood anomalies, cluster signals, estimate initial severity',
        condition: (state) => state.signalCount > 0,
      },
      {
        id: 3,
        name: 'Weather Correlation',
        agent: 'REASONING_AGENT',
        task: 'Combine weather + traffic + social signals for confidence scoring',
        condition: (state) => state.crisisDetected,
      },
      {
        id: 4,
        name: 'Severity Escalation Check',
        agent: 'ESCALATION_AGENT',
        task: 'Determine if severity requires immediate escalation to NDMA',
        condition: (state) => state.confidence >= 70,
      },
      {
        id: 5,
        name: 'Action Plan Generation',
        agent: 'ACTION_PLANNING_AGENT',
        task: 'Generate coordinated response plan: rerouting, dispatch, alerts',
        condition: (state) => state.crisisDetected,
      },
      {
        id: 6,
        name: 'Route Rerouting Execution',
        agent: 'SIMULATION_AGENT',
        task: 'Activate alternate routes, override traffic signals',
      },
      {
        id: 7,
        name: 'Emergency Dispatch',
        agent: 'SIMULATION_AGENT',
        task: 'Dispatch rescue teams, ambulances, pump units',
      },
      {
        id: 8,
        name: 'Alert Broadcast',
        agent: 'ALERT_AGENT',
        task: 'Send SMS, push, radio, and navigation app alerts',
      },
      {
        id: 9,
        name: 'Trace Report Generation',
        agent: 'TRACE_LOGGING_AGENT',
        task: 'Generate full workflow execution report for Antigravity dashboard',
      }
    ]
  },

  // ── SECONDARY: Traffic Disruption Workflow ──────────────
  TRAFFIC_DISRUPTION: {
    name: 'Traffic Disruption Response',
    description: 'Rapid rerouting and incident management for traffic blockages',
    version: '1.0.0',
    priority: 'P2_HIGH',
    steps: [
      { id: 1, name: 'Signal Ingestion', agent: 'SIGNAL_INGESTION_AGENT', task: 'Ingest traffic sensor data' },
      { id: 2, name: 'Congestion Analysis', agent: 'EVENT_DETECTION_AGENT', task: 'Identify blocked routes and congestion hotspots' },
      { id: 3, name: 'Route Planning', agent: 'ACTION_PLANNING_AGENT', task: 'Calculate optimal alternate routes' },
      { id: 4, name: 'Signal Override', agent: 'SIMULATION_AGENT', task: 'Override traffic signals for emergency routing' },
      { id: 5, name: 'Motorist Alerts', agent: 'ALERT_AGENT', task: 'Push alerts to Waze, Google Maps, and CIRO app' }
    ]
  },

  // ── TERTIARY: Weather Alert Workflow ────────────────────
  WEATHER_ALERT: {
    name: 'Weather Alert Processing',
    description: 'Pre-emptive response to severe weather PMD alerts',
    version: '1.0.0',
    priority: 'P2_HIGH',
    steps: [
      { id: 1, name: 'PMD Alert Ingest', agent: 'SIGNAL_INGESTION_AGENT', task: 'Parse PMD weather API alerts' },
      { id: 2, name: 'Risk Zone Mapping', agent: 'REASONING_AGENT', task: 'Map high-risk zones based on historical flood data' },
      { id: 3, name: 'Preemptive Dispatch', agent: 'ACTION_PLANNING_AGENT', task: 'Pre-position rescue units at risk zones' },
      { id: 4, name: 'Public Warning', agent: 'ALERT_AGENT', task: 'Issue advance warning to G-10 residents' }
    ]
  }
};

// ── Workflow metadata registry ─────────────────────────────
const workflowRegistry = Object.entries(workflowDefinitions).map(([key, wf]) => ({
  id: key,
  name: wf.name,
  description: wf.description,
  priority: wf.priority,
  stepCount: wf.steps.length
}));

module.exports = { workflowDefinitions, workflowRegistry };
