import { describe, it, expect } from './test-runner';
import {
  filterLogs,
  updateTelemetry,
  enqueueCommand,
  executeCommand,
  calculateAutoScrollState,
} from '../lib/monitor-engine';
import type { AgentLog, AgentTelemetry, AgentCommand } from '../lib/types';

describe('Tier 3: Cross-Feature Combinations - Search Filtering during Live Stream Auto-Scroll', () => {
  it('T3.1.1: should continuously filter streaming incoming logs without breaking scroll calculations', () => {
    let logBuffer: AgentLog[] = [
      { id: '1', timestamp: 1000, agentId: 'worker_1', type: 'stdout', message: 'Task initialized' },
      { id: '2', timestamp: 1005, agentId: 'worker_2', type: 'stderr', message: 'Error in worker 2' },
    ];

    // User applies filter for worker_1
    let filterResult = filterLogs(logBuffer, { agentId: 'worker_1' });
    expect(filterResult.filtered.length).toBe(1);

    // Initial scroll state: user is at bottom -> auto-scroll true
    let autoScroll = calculateAutoScrollState(500, 1000, 500, 30);
    expect(autoScroll).toBe(true);

    // Stream 10 new logs: 5 for worker_1, 5 for worker_2
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      const isWorker1 = i % 2 === 0;
      logBuffer.push({
        id: `stream_${i}`,
        timestamp: now + i * 10,
        agentId: isWorker1 ? 'worker_1' : 'worker_2',
        type: 'stdout',
        message: `Streaming log ${i} for ${isWorker1 ? 'worker_1' : 'worker_2'}`,
      });
    }

    // Re-apply filter on updated logBuffer
    filterResult = filterLogs(logBuffer, { agentId: 'worker_1' });
    expect(filterResult.filtered.length).toBe(6); // 1 initial + 5 streamed

    // User scrolls up to view older logs (top=200, height=2000, client=500)
    autoScroll = calculateAutoScrollState(200, 2000, 500, 30);
    expect(autoScroll).toBe(false);

    // Stream 5 more logs for worker_1 while scrolled up
    for (let i = 10; i < 15; i++) {
      logBuffer.push({
        id: `stream_${i}`,
        timestamp: now + i * 10,
        agentId: 'worker_1',
        type: 'stdout',
        message: `Streaming log ${i} for worker_1`,
      });
    }

    filterResult = filterLogs(logBuffer, { agentId: 'worker_1' });
    expect(filterResult.filtered.length).toBe(11);
    // Auto scroll remains false because user position didn't snap to bottom
    expect(autoScroll).toBe(false);
  });
});

describe('Tier 3: Cross-Feature Combinations - Command Queueing Synchronized with Live Telemetry', () => {
  it('T3.2.1: should synchronize remote control command dispatch with telemetry state and system log emission', () => {
    let telemetryStore: AgentTelemetry[] = [
      {
        id: 'agent_worker_1',
        name: 'Worker Node 1',
        role: 'worker',
        status: 'running',
        cpuUsage: 85.4,
        memoryUsage: 512.0,
        lastActive: Date.now(),
      },
    ];

    let commandQueue: AgentCommand[] = [];
    let logFeed: AgentLog[] = [];

    // Step 1: User issues remote command to stop worker 1
    const enqueueRes = enqueueCommand(commandQueue, {
      command: 'stop_process',
      agentId: 'agent_worker_1',
    });
    commandQueue = enqueueRes.updatedCommands;
    const commandId = enqueueRes.newCommand!.id;

    expect(commandQueue.length).toBe(1);
    expect(commandQueue[0].status).toBe('pending');

    // Step 2: System processes command
    const execRes = executeCommand(commandQueue, commandId);
    commandQueue = execRes.updatedCommands;
    expect(execRes.executedCommand?.status).toBe('executed');

    // Step 3: Telemetry state updates agent status to idle, cpuUsage to 0
    telemetryStore = updateTelemetry(telemetryStore, {
      id: 'agent_worker_1',
      status: 'idle',
      cpuUsage: 0.0,
    });

    expect(telemetryStore[0].status).toBe('idle');
    expect(telemetryStore[0].cpuUsage).toBe(0.0);

    // Step 4: System log emitted to log feed
    logFeed.push({
      id: `sys_log_${Date.now()}`,
      timestamp: Date.now(),
      agentId: 'agent_worker_1',
      type: 'system',
      message: `Command stop_process executed. Agent agent_worker_1 state set to idle.`,
    });

    const systemLogs = filterLogs(logFeed, { level: 'system', agentId: 'agent_worker_1' });
    expect(systemLogs.filtered.length).toBe(1);
    expect(systemLogs.filtered[0].message).toContain('stop_process executed');
  });
});

describe('Tier 3: Cross-Feature Combinations - Multi-Filter Matrix Operations', () => {
  const matrixLogs: AgentLog[] = [
    { id: '1', timestamp: 100, agentId: 'bot_alpha', type: 'stdout', message: 'Running query test_1' },
    { id: '2', timestamp: 200, agentId: 'bot_alpha', type: 'stderr', message: 'ERROR: connection lost test_2' },
    { id: '3', timestamp: 300, agentId: 'bot_beta', type: 'stderr', message: 'ERROR: timeout test_3' },
    { id: '4', timestamp: 400, agentId: 'bot_beta', type: 'system', message: 'System heartbeat OK' },
  ];

  it('T3.3.1: should apply combined level + agent + regex query filter matrix correctly', () => {
    const res = filterLogs(matrixLogs, {
      level: 'stderr',
      agentId: 'bot_alpha',
      searchQuery: 'ERROR:.*test_2',
      useRegex: true,
    });

    expect(res.filtered.length).toBe(1);
    expect(res.filtered[0].id).toBe('2');
  });

  it('T3.3.2: should maintain intact level and agent filters when search query is cleared', () => {
    // Stage 1: Full matrix
    let res = filterLogs(matrixLogs, {
      level: 'stderr',
      agentId: 'bot_beta',
      searchQuery: 'timeout',
    });
    expect(res.filtered.length).toBe(1);

    // Stage 2: Clear search query
    res = filterLogs(matrixLogs, {
      level: 'stderr',
      agentId: 'bot_beta',
      searchQuery: '',
    });
    expect(res.filtered.length).toBe(1);
    expect(res.filtered[0].id).toBe('3');

    // Stage 3: Clear agent filter, keep level filter
    res = filterLogs(matrixLogs, {
      level: 'stderr',
      agentId: '',
      searchQuery: '',
    });
    expect(res.filtered.length).toBe(2); // IDs 2 and 3
  });
});
