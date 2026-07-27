import { describe, it, expect } from './test-runner.ts';
import {
  filterLogs,
  updateTelemetry,
  enqueueCommand,
  executeCommand,
  formatLogLine,
} from '../lib/monitor-engine.ts';
import type { AgentLog, AgentTelemetry, AgentCommand } from '../lib/types.ts';

describe('Tier 4: Real-World Scenarios - Multi-Agent Pipeline Execution', () => {
  it('T4.1.1: should simulate complete lifecycle of a multi-agent workflow with state coherence across all components', () => {
    let logs: AgentLog[] = [];
    let agents: AgentTelemetry[] = [];
    let commands: AgentCommand[] = [];

    const now = Date.now();

    // Step 1: Orchestrator initialization
    agents = updateTelemetry(agents, {
      id: 'orch_main',
      name: 'Main Orchestrator',
      role: 'orchestrator',
      status: 'running',
      cpuUsage: 15.0,
      memoryUsage: 120.0,
    });

    logs.push({
      id: 'log_orch_start',
      timestamp: now,
      agentId: 'orch_main',
      type: 'system',
      message: 'Orchestrator online. Initializing pipeline...',
    });

    expect(agents.length).toBe(1);
    expect(logs.length).toBe(1);

    // Step 2: Spawn Workers
    agents = updateTelemetry(agents, {
      id: 'worker_m1',
      name: 'Worker M1',
      role: 'implementer',
      status: 'running',
      cpuUsage: 60.0,
      memoryUsage: 250.0,
    });

    agents = updateTelemetry(agents, {
      id: 'worker_m2',
      name: 'Worker M2',
      role: 'qa',
      status: 'running',
      cpuUsage: 45.0,
      memoryUsage: 180.0,
    });

    logs.push(
      {
        id: 'log_w1_start',
        timestamp: now + 500,
        agentId: 'worker_m1',
        type: 'stdout',
        message: '[worker_m1] Building Next.js application scaffold...',
      },
      {
        id: 'log_w2_start',
        timestamp: now + 600,
        agentId: 'worker_m2',
        type: 'stderr',
        message: '[worker_m2] Warning: Deprecated API usage in router config',
      }
    );

    expect(agents.length).toBe(3);
    expect(logs.length).toBe(3);

    // Step 3: Send Remote Control Command to Pause worker_m2
    const enqueueRes = enqueueCommand(commands, {
      command: 'pause_agent',
      agentId: 'worker_m2',
    });
    commands = enqueueRes.updatedCommands;
    const cmdId = enqueueRes.newCommand!.id;

    expect(commands.length).toBe(1);
    expect(commands[0].status).toBe('pending');

    // Step 4: Execute Command & Update worker_m2 Status
    const execRes = executeCommand(commands, cmdId);
    commands = execRes.updatedCommands;
    expect(commands[0].status).toBe('executed');

    agents = updateTelemetry(agents, {
      id: 'worker_m2',
      status: 'idle',
      cpuUsage: 0.0,
    });

    logs.push({
      id: 'log_sys_pause',
      timestamp: now + 1200,
      agentId: 'worker_m2',
      type: 'system',
      message: 'System: Remote command pause_agent executed for worker_m2',
    });

    const m2Status = agents.find((a) => a.id === 'worker_m2');
    expect(m2Status?.status).toBe('idle');
    expect(m2Status?.cpuUsage).toBe(0.0);

    // Step 5: worker_m1 completes task successfully
    agents = updateTelemetry(agents, {
      id: 'worker_m1',
      status: 'completed',
      cpuUsage: 0.0,
    });

    logs.push({
      id: 'log_w1_done',
      timestamp: now + 2000,
      agentId: 'worker_m1',
      type: 'stdout',
      message: '[worker_m1] Build completed with 0 errors.',
    });

    const m1Status = agents.find((a) => a.id === 'worker_m1');
    expect(m1Status?.status).toBe('completed');

    // Step 6: Verify Search & Log Drawer query for stderr/warnings
    const searchRes = filterLogs(logs, { level: 'stderr' });
    expect(searchRes.filtered.length).toBe(1);
    expect(searchRes.filtered[0].agentId).toBe('worker_m2');

    // Step 7: Verify Log Formatting output
    const fmtLog = formatLogLine(searchRes.filtered[0]);
    expect(fmtLog.textColorClass).toContain('red');
  });
});

describe('Tier 4: Real-World Scenarios - High-Load Agent Crash & System Recovery', () => {
  it('T4.2.1: should handle agent failure stack trace under high load and recover state via remote restart command', () => {
    let logs: AgentLog[] = [];
    let agents: AgentTelemetry[] = [
      { id: 'agent_1', name: 'Agent 1', role: 'worker', status: 'running', cpuUsage: 92.0, memoryUsage: 400.0, lastActive: Date.now() },
      { id: 'agent_2', name: 'Agent 2', role: 'worker', status: 'running', cpuUsage: 88.0, memoryUsage: 380.0, lastActive: Date.now() },
      { id: 'agent_3', name: 'Agent 3', role: 'worker', status: 'running', cpuUsage: 96.0, memoryUsage: 512.0, lastActive: Date.now() },
    ];
    let commands: AgentCommand[] = [];

    const now = Date.now();

    // Step 1: Agent 3 encounters panic error
    agents = updateTelemetry(agents, {
      id: 'agent_3',
      status: 'error',
      cpuUsage: 0.0,
    });

    logs.push({
      id: 'log_panic',
      timestamp: now,
      agentId: 'agent_3',
      type: 'stderr',
      message: 'FATAL: OutOfMemoryError in process thread 4.\n    at heapAllocate (native:0x4f3a)\n    at processTask (worker.js:142)',
    });

    expect(agents.find((a) => a.id === 'agent_3')?.status).toBe('error');

    // Search drawer regex search for FATAL stack trace
    const fatalSearch = filterLogs(logs, { searchQuery: 'FATAL:.*OutOfMemory', useRegex: true });
    expect(fatalSearch.filtered.length).toBe(1);
    expect(fatalSearch.filtered[0].agentId).toBe('agent_3');

    // Step 2: Operator sends remote command to restart agent_3
    const enqueueRes = enqueueCommand(commands, {
      command: 'restart_agent',
      agentId: 'agent_3',
    });
    commands = enqueueRes.updatedCommands;
    const cmdId = enqueueRes.newCommand!.id;

    // Step 3: Execute restart command
    const execRes = executeCommand(commands, cmdId);
    commands = execRes.updatedCommands;

    // Step 4: Agent 3 recovers status to running
    agents = updateTelemetry(agents, {
      id: 'agent_3',
      status: 'running',
      cpuUsage: 25.0,
      memoryUsage: 150.0,
    });

    logs.push({
      id: 'log_recovered',
      timestamp: now + 500,
      agentId: 'agent_3',
      type: 'system',
      message: 'Agent agent_3 process restarted successfully. Memory heap reset.',
    });

    expect(agents.find((a) => a.id === 'agent_3')?.status).toBe('running');
    expect(agents.find((a) => a.id === 'agent_3')?.cpuUsage).toBe(25.0);

    const systemLogs = filterLogs(logs, { level: 'system', agentId: 'agent_3' });
    expect(systemLogs.filtered.length).toBe(1);
    expect(systemLogs.filtered[0].message).toContain('restarted successfully');
  });
});
