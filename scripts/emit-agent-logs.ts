/**
 * Telemetry & Mock Log Emitter Script
 * Generates mock Antigravity CLI agent logs (stdout, stderr, system),
 * updates subagent telemetry metrics in Firebase Realtime Database / mock store,
 * and processes queued remote control commands.
 */

import { ref, set, get, update, push, child } from 'firebase/database';
import { rtdb, mockStore, isFirebaseConfigured } from '../lib/firebase.ts';
import type { AgentLog, AgentTelemetry, AgentCommand, LogType, AgentStatus } from '../lib/types.ts';

// Initial Agents Definition
const agentsList: AgentTelemetry[] = [
  {
    id: 'orchestrator',
    name: 'Antigravity Orchestrator',
    role: 'orchestrator',
    status: 'running',
    cpuUsage: 28.5,
    memoryUsage: 185.2,
    lastActive: Date.now(),
  },
  {
    id: 'worker_m1',
    name: 'UI & Scaffolding Worker',
    role: 'implementer',
    status: 'running',
    cpuUsage: 42.0,
    memoryUsage: 215.6,
    lastActive: Date.now(),
  },
  {
    id: 'worker_m2',
    name: 'Firebase & Emitter Worker',
    role: 'qa',
    status: 'running',
    cpuUsage: 35.8,
    memoryUsage: 198.4,
    lastActive: Date.now(),
  },
  {
    id: 'specialist_1',
    name: 'GSAP Motion Specialist',
    role: 'specialist',
    status: 'idle',
    cpuUsage: 12.3,
    memoryUsage: 142.1,
    lastActive: Date.now(),
  },
];

// Sample log pools per agent
const mockLogTemplates: Record<string, { type: LogType; message: string }[]> = {
  orchestrator: [
    { type: 'system', message: '[Orchestrator] Initialized task pipeline for live_agent_monitor' },
    { type: 'stdout', message: '[Orchestrator] Validating task progress across worker nodes...' },
    { type: 'system', message: '[Orchestrator] Dispatched worker_m2 to implement Firebase integration & emitter' },
    { type: 'stdout', message: '[Orchestrator] Compiled Next.js production build: static pages generated' },
    { type: 'stderr', message: '[Orchestrator] Alert: Memory usage spike detected on worker_m1, compacting state' },
  ],
  worker_m1: [
    { type: 'stdout', message: '[worker_m1] Configured Tailwind CSS 3.4 theme tokens (Charcoal & Sea Green)' },
    { type: 'stdout', message: '[worker_m1] Initialized Lenis smooth scrolling provider in root layout' },
    { type: 'stderr', message: '[worker_m1] Notice: Replaced legacy style rule in layout header component' },
    { type: 'stdout', message: '[worker_m1] TerminalFeed and TelemetryCards component templates created' },
  ],
  worker_m2: [
    { type: 'stdout', message: '[worker_m2] Initializing Firebase app with Realtime Database SDK...' },
    { type: 'stdout', message: '[worker_m2] Configured security rules in database.rules.json for read/write access' },
    { type: 'stdout', message: '[worker_m2] Emitting mock Antigravity agent process telemetry packet...' },
    { type: 'stderr', message: '[worker_m2] Warning: NEXT_PUBLIC_FIREBASE_API_KEY environment variable not set, using fallback configuration' },
    { type: 'system', message: '[worker_m2] Written log entry to Firebase logs/ node successfully' },
  ],
  specialist_1: [
    { type: 'stdout', message: '[specialist_1] Rendered smooth GSAP timeline transitions for terminal feed' },
    { type: 'stdout', message: '[specialist_1] Applied subtle glow pulse animation to active telemetry pills' },
    { type: 'system', message: '[specialist_1] Motion audit complete: 60fps frame rate target met' },
  ],
};

/**
 * Write log entry to Firebase RTDB & local fallback store
 */
export async function writeLog(log: AgentLog): Promise<void> {
  // Always update mock store fallback
  mockStore.logs[log.id] = log;

  if (rtdb) {
    try {
      const logsRef = ref(rtdb, `logs/${log.id}`);
      await set(logsRef, log);
    } catch (err) {
      console.warn(`[Emitter] Notice: Could not push to live Firebase RTDB (using fallback store):`, (err as Error).message);
    }
  }
}

/**
 * Write/update agent telemetry metrics in Firebase RTDB & local fallback store
 */
export async function writeAgentTelemetry(agent: AgentTelemetry): Promise<void> {
  mockStore.agents[agent.id] = agent;

  if (rtdb) {
    try {
      const agentRef = ref(rtdb, `agents/${agent.id}`);
      await set(agentRef, agent);
    } catch (err) {
      console.warn(`[Emitter] Notice: Could not write agent telemetry to live Firebase RTDB:`, (err as Error).message);
    }
  }
}

/**
 * Check and process pending remote control commands from Firebase / mock store
 */
export async function processPendingCommands(): Promise<number> {
  let processedCount = 0;

  // Check live Firebase RTDB
  if (rtdb) {
    try {
      const cmdSnapshot = await get(child(ref(rtdb), 'commands'));
      if (cmdSnapshot.exists()) {
        const commandsData = cmdSnapshot.val() as Record<string, AgentCommand>;
        for (const [cmdId, cmd] of Object.entries(commandsData)) {
          if (cmd.status === 'pending') {
            console.log(`[Emitter] Processing queued command [${cmdId}]: "${cmd.command}" for agent ${cmd.agentId}`);
            
            // Emit execution log
            const execLog: AgentLog = {
              id: `log_cmd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              timestamp: Date.now(),
              agentId: cmd.agentId,
              type: 'system',
              message: `[RemoteControl] Executed queued command: "${cmd.command}" on agent "${cmd.agentId}"`,
              status: 'executed',
            };
            await writeLog(execLog);

            // Update command status in Firebase
            await update(ref(rtdb, `commands/${cmdId}`), { status: 'executed' });

            // Update agent state if command specifies (e.g. restart / resume)
            const matchingAgent = agentsList.find((a) => a.id === cmd.agentId);
            if (matchingAgent) {
              matchingAgent.status = 'running';
              matchingAgent.lastActive = Date.now();
              await writeAgentTelemetry(matchingAgent);
            }

            processedCount++;
          }
        }
      }
    } catch (err) {
      // Ignore network errors on commands check
    }
  }

  // Also check mockStore commands fallback
  for (const [cmdId, cmd] of Object.entries(mockStore.commands)) {
    if (cmd.status === 'pending') {
      console.log(`[Emitter] Processing queued mock command [${cmdId}]: "${cmd.command}" for agent ${cmd.agentId}`);
      cmd.status = 'executed';
      
      const execLog: AgentLog = {
        id: `log_cmd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: Date.now(),
        agentId: cmd.agentId,
        type: 'system',
        message: `[RemoteControl] Executed queued mock command: "${cmd.command}" on agent "${cmd.agentId}"`,
        status: 'executed',
      };
      await writeLog(execLog);
      processedCount++;
    }
  }

  return processedCount;
}

/**
 * Emit one batch cycle of mock agent logs and telemetry
 */
export async function emitBatch(iterationIndex: number = 1): Promise<{ logsCount: number; agentsCount: number; commandsProcessed: number }> {
  console.log(`\n--- [Emitter Batch Iteration #${iterationIndex}] ---`);
  let logsCount = 0;

  // 1. Emit Agent Telemetry Updates
  for (const agent of agentsList) {
    // Fluctuating CPU & RAM
    const cpuDelta = (Math.random() * 8 - 4);
    const ramDelta = (Math.random() * 10 - 5);
    agent.cpuUsage = Math.min(100, Math.max(5, parseFloat((agent.cpuUsage + cpuDelta).toFixed(1))));
    agent.memoryUsage = Math.max(50, parseFloat((agent.memoryUsage + ramDelta).toFixed(1)));
    agent.lastActive = Date.now();

    await writeAgentTelemetry(agent);
  }
  console.log(`[Emitter] Updated telemetry for ${agentsList.length} active agents.`);

  // 2. Select randomly 2-3 agents to emit logs
  const selectedAgents = [...agentsList].sort(() => 0.5 - Math.random()).slice(0, 3);
  for (const agent of selectedAgents) {
    const templates = mockLogTemplates[agent.id] || [
      { type: 'stdout', message: `[${agent.id}] Process running normally.` },
    ];
    const logItem = templates[Math.floor(Math.random() * templates.length)];

    const logEntry: AgentLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      agentId: agent.id,
      type: logItem.type,
      message: logItem.message,
      status: agent.status,
    };

    await writeLog(logEntry);
    console.log(`  [${logEntry.type.toUpperCase()}] [${logEntry.agentId}] ${logEntry.message}`);
    logsCount++;
  }

  // 3. Process any pending commands
  const commandsProcessed = await processPendingCommands();

  console.log(`[Emitter Batch #${iterationIndex}] Complete: ${logsCount} logs written, ${agentsList.length} agents updated, ${commandsProcessed} commands processed.`);

  return { logsCount, agentsCount: agentsList.length, commandsProcessed };
}

/**
 * Script execution entrypoint
 */
async function main() {
  const args = process.argv.slice(2);
  const isOnce = args.includes('--once') || args.includes('--single-run') || process.env.NODE_ENV === 'test';

  console.log('====================================================');
  console.log('  ANTIGRAVITY CLI LIVE AGENT LOG EMITTER SCRIPT     ');
  console.log('====================================================');
  console.log(`Firebase status: ${isFirebaseConfigured() ? 'LIVE CONFIG DETECTED' : 'MOCK FALLBACK MODE'}`);
  console.log(`Execution mode: ${isOnce ? 'SINGLE RUN (--once)' : 'CONTINUOUS STREAM'}`);

  let iteration = 1;
  await emitBatch(iteration);

  if (isOnce) {
    console.log('\n[Emitter] Single-run execution completed successfully. Exiting.');
    process.exit(0);
  }

  // Continuous stream loop (every 3 seconds)
  const interval = setInterval(async () => {
    iteration++;
    try {
      await emitBatch(iteration);
    } catch (err) {
      console.error('[Emitter] Error during emit batch:', err);
    }
  }, 3000);

  const shutdown = () => {
    console.log('\n[Emitter] Shutting down log emitter loop cleanly.');
    clearInterval(interval);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Execute when run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('emit-agent-logs.ts')) {
  main().catch((err) => {
    console.error('[Emitter] Fatal error:', err);
    process.exit(1);
  });
}
