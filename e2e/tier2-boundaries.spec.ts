import { describe, it, expect } from './test-runner';
import {
  filterLogs,
  updateTelemetry,
  enqueueCommand,
  executeCommand,
  escapeRegExp,
} from '../lib/monitor-engine';
import type { AgentLog, AgentTelemetry, AgentCommand } from '../lib/types';

describe('Tier 2: Boundary & Corner Cases - Empty & Zero States', () => {
  it('T2.1.1: should handle filtering against an empty log dataset without throwing', () => {
    const emptyLogs: AgentLog[] = [];
    const res = filterLogs(emptyLogs, { level: 'stderr', searchQuery: 'error', useRegex: true });
    expect(res.filtered.length).toBe(0);
    expect(res.regexError).toBe(undefined);
  });

  it('T2.1.2: should safely handle empty agent telemetry array', () => {
    const agents: AgentTelemetry[] = [];
    const updated = updateTelemetry(agents, { id: 'agent_1', name: 'Fresh Agent' });
    expect(updated.length).toBe(1);
    expect(updated[0].status).toBe('running');
    expect(updated[0].cpuUsage).toBe(0);
  });

  it('T2.1.3: should return graceful error when executing non-existent command', () => {
    const commands: AgentCommand[] = [];
    const res = executeCommand(commands, 'non_existent_id');
    expect(res.error).toContain('not found');
    expect(res.updatedCommands.length).toBe(0);
  });
});

describe('Tier 2: Boundary & Corner Cases - High Volume & Large Payload Logs', () => {
  it('T2.2.1: should process 5,000 log entries rapidly under 100ms', () => {
    const largeDataset: AgentLog[] = [];
    const now = Date.now();
    for (let i = 0; i < 5000; i++) {
      largeDataset.push({
        id: `log_${i}`,
        timestamp: now + i,
        agentId: i % 2 === 0 ? 'agent_even' : 'agent_odd',
        type: i % 10 === 0 ? 'stderr' : i % 5 === 0 ? 'system' : 'stdout',
        message: `Log line execution payload #${i} with process state metrics and trace metadata`,
      });
    }

    const tStart = Date.now();
    const result = filterLogs(largeDataset, { level: 'stderr', searchQuery: 'payload' });
    const elapsed = Date.now() - tStart;

    expect(result.filtered.length).toBe(500);
    expect(elapsed).toBeLessThan(100);
  });

  it('T2.2.2: should handle single log entry with 50,000+ character payload without crashing', () => {
    const hugeMessage = 'STACK_TRACE_LINE_HEADER: ' + 'A'.repeat(50000) + ' END_TRACE';
    const log: AgentLog = {
      id: 'huge_1',
      timestamp: Date.now(),
      agentId: 'worker_heavy',
      type: 'stderr',
      message: hugeMessage,
    };

    const res = filterLogs([log], { searchQuery: 'END_TRACE' });
    expect(res.filtered.length).toBe(1);
    expect(res.filtered[0].message.length).toBeGreaterThan(50000);
  });
});

describe('Tier 2: Boundary & Corner Cases - Special & Malformed Regex Search', () => {
  const logSet: AgentLog[] = [
    { id: '1', timestamp: 100, agentId: 'agent_1', type: 'stdout', message: 'Price is $100.00 (discounted)' },
    { id: '2', timestamp: 200, agentId: 'agent_1', type: 'stdout', message: 'Regex symbols: ^ [test] + * ? (group)' },
    { id: '3', timestamp: 300, agentId: 'agent_2', type: 'stderr', message: 'Path: C:\\Program Files\\App' },
  ];

  it('T2.3.1: should escape special regex characters safely using escapeRegExp helper', () => {
    const raw = '$100.00 (discounted)';
    const escaped = escapeRegExp(raw);
    expect(escaped).toBe('\\$100\\.00 \\(discounted\\)');

    const res = filterLogs(logSet, { searchQuery: escaped, useRegex: true });
    expect(res.filtered.length).toBe(1);
    expect(res.filtered[0].id).toBe('1');
  });

  it('T2.3.2: should gracefully catch malformed regex strings and return regexError without throwing', () => {
    const invalidRegexes = ['[unclosed-class', '*quantifier-at-start', '(?=unmatched', '(abc'];

    for (const invalidQuery of invalidRegexes) {
      const res = filterLogs(logSet, { searchQuery: invalidQuery, useRegex: true });
      expect(res.filtered.length).toBe(0);
      expect(res.regexError).toSatisfy(
        (err) => err !== undefined && err.includes('Invalid Regex'),
        'regexError should be defined'
      );
    }
  });
});

describe('Tier 2: Boundary & Corner Cases - Invalid Commands & Inputs', () => {
  const commands: AgentCommand[] = [];

  it('T2.4.1: should reject empty command strings', () => {
    const res = enqueueCommand(commands, { command: '', agentId: 'agent_1' });
    expect(res.error).toBe('Command cannot be empty');
  });

  it('T2.4.2: should reject whitespace-only command strings', () => {
    const res = enqueueCommand(commands, { command: '   \n  \t ', agentId: 'agent_1' });
    expect(res.error).toBe('Command cannot be empty');
  });

  it('T2.4.3: should reject commands exceeding maximum length limit of 2000 chars', () => {
    const longCmd = 'x'.repeat(2001);
    const res = enqueueCommand(commands, { command: longCmd, agentId: 'agent_1' });
    expect(res.error).toContain('exceeds maximum length');
  });

  it('T2.4.4: should reject commands missing target agent ID', () => {
    const res = enqueueCommand(commands, { command: 'stop process', agentId: '   ' });
    expect(res.error).toBe('Target Agent ID is required');
  });
});
