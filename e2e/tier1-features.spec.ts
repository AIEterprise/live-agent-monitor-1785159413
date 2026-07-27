import { describe, it, expect } from './test-runner.ts';
import {
  filterLogs,
  updateTelemetry,
  enqueueCommand,
  executeCommand,
  calculateAutoScrollState,
  formatLogLine,
} from '../lib/monitor-engine.ts';
import type { AgentLog, AgentTelemetry, AgentCommand } from '../lib/types.ts';

describe('Tier 1: Feature Coverage - Terminal Feed Engine', () => {
  const sampleLogs: AgentLog[] = [
    {
      id: 'log_1',
      timestamp: 1770000000000,
      agentId: 'orchestrator',
      type: 'system',
      message: 'Agent orchestrator initialized',
    },
    {
      id: 'log_2',
      timestamp: 1770000001000,
      agentId: 'worker_1',
      type: 'stdout',
      message: 'Compiling TypeScript code...',
    },
    {
      id: 'log_3',
      timestamp: 1770000002000,
      agentId: 'worker_1',
      type: 'stderr',
      message: 'Warning: Unused import in module.ts',
    },
  ];

  it('T1.1.1: should format timestamps and assign color classes correctly for stdout/stderr/system', () => {
    const sysFmt = formatLogLine(sampleLogs[0]);
    expect(sysFmt.badgeColorClass).toContain('emerald');
    expect(sysFmt.textColorClass).toContain('emerald');

    const outFmt = formatLogLine(sampleLogs[1]);
    expect(outFmt.badgeColorClass).toContain('sky');
    expect(outFmt.textColorClass).toContain('sky');

    const errFmt = formatLogLine(sampleLogs[2]);
    expect(errFmt.badgeColorClass).toContain('red');
    expect(errFmt.textColorClass).toContain('red');
  });

  it('T1.1.2: should maintain auto-scroll enabled when scrolled near bottom', () => {
    // Top=900, Height=2000, Client=1100 -> distance from bottom = 2000 - 2000 = 0 <= 30
    const autoScroll = calculateAutoScrollState(900, 2000, 1100, 30);
    expect(autoScroll).toBe(true);
  });

  it('T1.1.3: should disable auto-scroll when user scrolls up away from bottom', () => {
    // Top=500, Height=2000, Client=1000 -> distance from bottom = 2000 - 1500 = 500 > 30
    const autoScroll = calculateAutoScrollState(500, 2000, 1000, 30);
    expect(autoScroll).toBe(false);
  });
});

describe('Tier 1: Feature Coverage - Agent Telemetry Cards', () => {
  const initialAgents: AgentTelemetry[] = [
    {
      id: 'agent_main',
      name: 'Main Orchestrator',
      role: 'orchestrator',
      status: 'running',
      cpuUsage: 25.5,
      memoryUsage: 128.4,
      lastActive: Date.now() - 1000,
    },
  ];

  it('T1.2.1: should correctly update CPU and memory metrics for existing agent', () => {
    const updated = updateTelemetry(initialAgents, {
      id: 'agent_main',
      cpuUsage: 45.0,
      memoryUsage: 156.2,
      status: 'running',
    });

    expect(updated.length).toBe(1);
    expect(updated[0].cpuUsage).toBe(45.0);
    expect(updated[0].memoryUsage).toBe(156.2);
  });

  it('T1.2.2: should add new subagent telemetry pill when new subagent process starts', () => {
    const updated = updateTelemetry(initialAgents, {
      id: 'agent_sub_1',
      name: 'Subagent Worker 1',
      role: 'worker',
      status: 'running',
      cpuUsage: 10.0,
      memoryUsage: 64.0,
    });

    expect(updated.length).toBe(2);
    expect(updated[1].id).toBe('agent_sub_1');
    expect(updated[1].status).toBe('running');
  });

  it('T1.2.3: should update status to completed or error upon task finish', () => {
    let state = updateTelemetry(initialAgents, { id: 'agent_main', status: 'completed' });
    expect(state[0].status).toBe('completed');

    state = updateTelemetry(state, { id: 'agent_main', status: 'error' });
    expect(state[0].status).toBe('error');
  });
});

describe('Tier 1: Feature Coverage - Remote Agent Control Panel', () => {
  const initialCommands: AgentCommand[] = [];

  it('T1.3.1: should queue valid command with status pending', () => {
    const res = enqueueCommand(initialCommands, {
      command: 'npm run build',
      agentId: 'worker_1',
    });

    expect(res.error).toBe(undefined);
    expect(res.updatedCommands.length).toBe(1);
    expect(res.newCommand?.command).toBe('npm run build');
    expect(res.newCommand?.status).toBe('pending');
    expect(res.newCommand?.agentId).toBe('worker_1');
  });

  it('T1.3.2: should transition command status from pending to executed', () => {
    const enqueueRes = enqueueCommand(initialCommands, {
      command: 'kill subagent_2',
      agentId: 'worker_2',
    });
    const cmdId = enqueueRes.newCommand!.id;

    const execRes = executeCommand(enqueueRes.updatedCommands, cmdId);
    expect(execRes.error).toBe(undefined);
    expect(execRes.executedCommand?.status).toBe('executed');
    expect(execRes.updatedCommands[0].status).toBe('executed');
  });
});

describe('Tier 1: Feature Coverage - Log Filter & Search Drawer', () => {
  const dataset: AgentLog[] = [
    { id: '1', timestamp: 100, agentId: 'agent_alpha', type: 'stdout', message: 'Starting task alpha' },
    { id: '2', timestamp: 200, agentId: 'agent_beta', type: 'stderr', message: 'Database connection failed' },
    { id: '3', timestamp: 300, agentId: 'agent_alpha', type: 'system', message: 'Task alpha completed' },
    { id: '4', timestamp: 400, agentId: 'agent_gamma', type: 'stdout', message: 'Fetch remote resource' },
  ];

  it('T1.4.1: should filter logs by log level (stdout, stderr, system)', () => {
    const stdoutRes = filterLogs(dataset, { level: 'stdout' });
    expect(stdoutRes.filtered.length).toBe(2);
    expect(stdoutRes.filtered.every((l) => l.type === 'stdout')).toBe(true);

    const stderrRes = filterLogs(dataset, { level: 'stderr' });
    expect(stderrRes.filtered.length).toBe(1);
    expect(stderrRes.filtered[0].id).toBe('2');

    const systemRes = filterLogs(dataset, { level: 'system' });
    expect(systemRes.filtered.length).toBe(1);
    expect(systemRes.filtered[0].id).toBe('3');
  });

  it('T1.4.2: should filter logs by agent ID', () => {
    const alphaLogs = filterLogs(dataset, { agentId: 'agent_alpha' });
    expect(alphaLogs.filtered.length).toBe(2);
    expect(alphaLogs.filtered.every((l) => l.agentId === 'agent_alpha')).toBe(true);
  });

  it('T1.4.3: should perform substring keyword search in log messages', () => {
    const searchRes = filterLogs(dataset, { searchQuery: 'connection' });
    expect(searchRes.filtered.length).toBe(1);
    expect(searchRes.filtered[0].message).toContain('connection');
  });
});
