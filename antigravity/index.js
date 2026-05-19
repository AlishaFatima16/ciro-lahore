/**
 * CIRO Antigravity Orchestration Engine
 * ──────────────────────────────────────
 * This is the core agentic orchestration layer.
 * It defines agents, workflows, and coordinates
 * multi-agent execution with full trace logging.
 *
 * Usage:
 *   node index.js          → run full CIRO workflow
 *   node demo.js           → interactive demo runner
 */

const { CIROOrchestrator } = require('./orchestrator');
const { workflowDefinitions } = require('./workflows/crisisWorkflow');

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🚨 CIRO — Crisis Intelligence & Response Orchestrator');
  console.log('  ⚡ Powered by Antigravity Orchestration Engine');
  console.log('═'.repeat(60) + '\n');

  const orchestrator = new CIROOrchestrator();

  // Register workflows
  for (const [name, wf] of Object.entries(workflowDefinitions)) {
    orchestrator.registerWorkflow(name, wf);
    console.log(`  ✅ Workflow registered: [${name}]`);
  }

  console.log('\n  📡 Starting crisis detection workflow...\n');
  console.log('─'.repeat(60));

  // Run the primary flood response workflow
  const result = await orchestrator.executeWorkflow('FLOOD_RESPONSE', {
    location: 'G-10, Islamabad',
    signalCount: 8,
    severity: 'HIGH',
    confidence: 92
  });

  console.log('\n' + '─'.repeat(60));
  console.log('\n  📊 WORKFLOW EXECUTION COMPLETE');
  console.log(`  ├─ Steps executed: ${result.stepsCompleted}`);
  console.log(`  ├─ Agents invoked: ${result.agentsInvoked}`);
  console.log(`  ├─ Trace events:   ${result.traceEvents}`);
  console.log(`  └─ Status:         ${result.status}\n`);
  console.log('═'.repeat(60) + '\n');

  return result;
}

main().catch(console.error);

module.exports = { CIROOrchestrator, workflowDefinitions };
