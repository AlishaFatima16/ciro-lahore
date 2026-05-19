/**
 * CIROOrchestrator
 * ─────────────────
 * Antigravity-style multi-agent orchestration engine.
 * Manages agent registration, workflow execution,
 * step planning, trace collection, and state management.
 */

const { v4: uuidv4 } = require('uuid');

class CIROOrchestrator {
  constructor() {
    this.agents = new Map();
    this.workflows = new Map();
    this.traces = [];
    this.state = {};
    this.sessionId = uuidv4();
  }

  // ── Agent Registration ─────────────────────────────────
  registerAgent(name, agentDef) {
    this.agents.set(name, {
      name,
      ...agentDef,
      status: 'idle',
      invocations: 0
    });
    this.log('ORCHESTRATOR', 'AGENT_REGISTERED', `Agent registered: [${name}]`, 'system');
  }

  // ── Workflow Registration ──────────────────────────────
  registerWorkflow(name, workflowDef) {
    this.workflows.set(name, workflowDef);
    this.log('ORCHESTRATOR', 'WORKFLOW_REGISTERED', `Workflow registered: [${name}] — ${workflowDef.steps.length} steps`, 'system');
  }

  // ── Execute Workflow ───────────────────────────────────
  async executeWorkflow(workflowName, initialContext = {}) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) throw new Error(`Workflow [${workflowName}] not found`);

    this.state = { ...initialContext };
    let stepsCompleted = 0;
    let agentsInvoked = new Set();

    this.log('ORCHESTRATOR', 'WORKFLOW_START', `▶ Executing workflow: [${workflowName}]`, 'info');

    for (const step of workflow.steps) {
      this.log('ORCHESTRATOR', 'STEP_START', `  → Step ${step.id}: ${step.name}`, 'info');

      // Check condition
      if (step.condition && !step.condition(this.state)) {
        this.log('ORCHESTRATOR', 'STEP_SKIP', `  ⏭ Step ${step.id} skipped — condition not met`, 'system');
        continue;
      }

      // Invoke agent
      if (step.agent) {
        const agent = this.agents.get(step.agent);
        if (!agent) {
          this.log('ORCHESTRATOR', 'AGENT_NOT_FOUND', `  ✗ Agent [${step.agent}] not found`, 'error');
          continue;
        }

        this.log(step.agent, 'AGENT_START', `  ⚙ [${step.agent}] executing: ${step.task}`, 'info');
        agent.status = 'running';
        agent.invocations++;
        agentsInvoked.add(step.agent);

        try {
          // Execute agent
          const output = await agent.execute(this.state, (msg, type) => {
            this.log(step.agent, type || 'AGENT_LOG', `    • ${msg}`, 'info');
          });

          // Merge output into state
          this.state = { ...this.state, ...output };
          agent.status = 'idle';
          stepsCompleted++;

          this.log(step.agent, 'AGENT_COMPLETE', `  ✓ [${step.agent}] complete → output keys: [${Object.keys(output).join(', ')}]`, 'success');
        } catch (err) {
          agent.status = 'error';
          this.log(step.agent, 'AGENT_ERROR', `  ✗ [${step.agent}] error: ${err.message}`, 'error');
        }
      }

      // Run side effects
      if (step.sideEffect) {
        await step.sideEffect(this.state, this.log.bind(this));
      }

      await delay(150);
    }

    const result = {
      workflowName,
      sessionId: this.sessionId,
      stepsCompleted,
      agentsInvoked: agentsInvoked.size,
      traceEvents: this.traces.length,
      status: 'COMPLETE',
      finalState: this.state
    };

    this.log('ORCHESTRATOR', 'WORKFLOW_COMPLETE', `✅ Workflow [${workflowName}] complete — ${stepsCompleted} steps, ${agentsInvoked.size} agents`, 'success');
    return result;
  }

  // ── Internal Trace Logger ──────────────────────────────
  log(agent, type, message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const entry = { id: this.traces.length + 1, timestamp, agent, type, message, level };
    this.traces.push(entry);

    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m',
      system: '\x1b[90m'
    };
    const reset = '\x1b[0m';
    const color = colors[level] || colors.info;
    console.log(`${color}[${timestamp}] [${agent}] ${message}${reset}`);
    return entry;
  }

  // ── Get all traces ─────────────────────────────────────
  getTraces() {
    return this.traces;
  }

  // ── Get current state ──────────────────────────────────
  getState() {
    return this.state;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { CIROOrchestrator };
