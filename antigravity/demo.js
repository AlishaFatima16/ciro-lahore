/**
 * demo.js — CIRO Antigravity Interactive Demo Runner
 * ────────────────────────────────────────────────────
 * Runs the complete multi-agent CIRO workflow with
 * full trace output. Use this to demonstrate the
 * Antigravity orchestration engine at the hackathon.
 *
 * Usage:  node demo.js
 */

const { CIROOrchestrator } = require('./orchestrator');
const { agentDefinitions } = require('./agents/agentDefinitions');
const { workflowDefinitions } = require('./workflows/crisisWorkflow');

const BANNER = `
╔══════════════════════════════════════════════════════════╗
║   🚨  CIRO — Crisis Intelligence & Response Orchestrator ║
║   ⚡  Antigravity Multi-Agent Demo                       ║
║   📍  Scenario: Urban Flooding — G-10, Islamabad         ║
╚══════════════════════════════════════════════════════════╝
`;

async function runDemo() {
    console.log(BANNER);

    // ── 1. Initialize Orchestrator ─────────────────────────
    const orchestrator = new CIROOrchestrator();
    console.log(`\n[INIT] Session ID: ${orchestrator.sessionId}\n`);

    // ── 2. Register all agents ─────────────────────────────
    console.log('── Registering Agents ──────────────────────────────────');
    for (const [name, def] of Object.entries(agentDefinitions)) {
        orchestrator.registerAgent(name, def);
    }

    // ── 3. Register all workflows ──────────────────────────
    console.log('\n── Registering Workflows ───────────────────────────────');
    for (const [name, wf] of Object.entries(workflowDefinitions)) {
        orchestrator.registerWorkflow(name, wf);
    }

    // ── 4. Execute primary crisis workflow ─────────────────
    console.log('\n── Executing Workflow: FLOOD_RESPONSE ──────────────────\n');

    const result = await orchestrator.executeWorkflow('FLOOD_RESPONSE', {
        location:    'G-10, Islamabad',
        signalCount: 8,
        severity:    'HIGH',
        confidence:  92,
    });

    // ── 5. Print summary ───────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('\n  📊  ANTIGRAVITY EXECUTION SUMMARY\n');
    console.log(`  ├─ Workflow       : ${result.workflowName}`);
    console.log(`  ├─ Session        : ${result.sessionId}`);
    console.log(`  ├─ Steps executed : ${result.stepsCompleted}`);
    console.log(`  ├─ Agents invoked : ${result.agentsInvoked}`);
    console.log(`  ├─ Trace events   : ${result.traceEvents}`);
    console.log(`  └─ Status         : ✅ ${result.status}`);

    console.log('\n  🗺️  Final State:');
    const s = result.finalState;
    if (s.crisisType)          console.log(`  ├─ Crisis          : ${s.crisisType} at ${s.crisisLocation}`);
    if (s.confidence)          console.log(`  ├─ Confidence      : ${s.confidence}%`);
    if (s.escalated)           console.log(`  ├─ Escalated       : P1_CRITICAL → ${s.authoritiesNotified?.join(', ')}`);
    if (s.alternateRoutes)     console.log(`  ├─ Alternate routes: ${s.alternateRoutes} activated`);
    if (s.congestionReduction) console.log(`  ├─ Congestion ↓    : ${s.congestionReduction}`);
    if (s.alertsSent)          console.log(`  └─ Alerts sent     : ${s.alertsSent} (reach: ${s.estimatedReach?.toLocaleString()})`);

    console.log('\n' + '═'.repeat(60));
    console.log('\n  ✅  Demo complete. All traces available at /api/logs\n');

    return result;
}

runDemo().catch(err => {
    console.error('\n[ERROR]', err.message);
    process.exit(1);
});
