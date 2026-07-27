import type { AgentLog, AgentTelemetry, AgentCommand, LogType, AgentStatus } from './types.ts';

/**
 * Escapes special regular expression characters in a string.
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface FilterOptions {
  level?: LogType | 'all';
  agentId?: string;
  searchQuery?: string;
  useRegex?: boolean;
}

export interface FilterResult {
  filtered: AgentLog[];
  regexError?: string;
}

/**
 * Filters agent logs based on log level, target agent ID, and text/regex search query.
 */
export function filterLogs(logs: AgentLog[], options: FilterOptions): FilterResult {
  const { level = 'all', agentId = '', searchQuery = '', useRegex = false } = options;

  let filtered = [...logs];

  // 1. Filter by Log Level
  if (level !== 'all') {
    filtered = filtered.filter((log) => log.type === level);
  }

  // 2. Filter by Agent ID
  if (agentId && agentId.trim() !== '') {
    const target = agentId.trim().toLowerCase();
    filtered = filtered.filter(
      (log) => log.agentId && log.agentId.toLowerCase() === target
    );
  }

  // 3. Filter by Search Query (Text or Regex)
  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.trim();

    if (useRegex) {
      try {
        const regex = new RegExp(query, 'i');
        filtered = filtered.filter((log) => regex.test(log.message) || regex.test(log.agentId));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Invalid regex pattern';
        return {
          filtered: [],
          regexError: `Invalid Regex: ${errorMessage}`,
        };
      }
    } else {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          (log.message && log.message.toLowerCase().includes(lowerQuery)) ||
          (log.agentId && log.agentId.toLowerCase().includes(lowerQuery))
      );
    }
  }

  return { filtered };
}

/**
 * Updates agent telemetry card list with live metrics or status transitions.
 */
export function updateTelemetry(
  agents: AgentTelemetry[],
  update: Partial<AgentTelemetry> & { id: string }
): AgentTelemetry[] {
  const index = agents.findIndex((a) => a.id === update.id);
  const now = Date.now();

  if (index >= 0) {
    const updated = [...agents];
    updated[index] = {
      ...updated[index],
      ...update,
      lastActive: update.lastActive || now,
    };
    return updated;
  } else {
    const newAgent: AgentTelemetry = {
      id: update.id,
      name: update.name || `Agent ${update.id}`,
      role: update.role || 'worker',
      status: update.status || 'running',
      cpuUsage: Math.min(100, Math.max(0, update.cpuUsage ?? 0)),
      memoryUsage: Math.max(0, update.memoryUsage ?? 0),
      lastActive: update.lastActive || now,
    };
    return [...agents, newAgent];
  }
}

/**
 * Command submission result contract.
 */
export interface CommandSubmissionResult {
  updatedCommands: AgentCommand[];
  newCommand?: AgentCommand;
  error?: string;
}

/**
 * Enqueues a new command to the remote control queue.
 */
export function enqueueCommand(
  commands: AgentCommand[],
  input: { command: string; agentId: string }
): CommandSubmissionResult {
  const trimmedCmd = input.command ? input.command.trim() : '';
  const trimmedAgent = input.agentId ? input.agentId.trim() : '';

  if (!trimmedCmd) {
    return { updatedCommands: commands, error: 'Command cannot be empty' };
  }

  if (trimmedCmd.length > 2000) {
    return { updatedCommands: commands, error: 'Command exceeds maximum length of 2000 characters' };
  }

  if (!trimmedAgent) {
    return { updatedCommands: commands, error: 'Target Agent ID is required' };
  }

  const newCommand: AgentCommand = {
    id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    command: trimmedCmd,
    agentId: trimmedAgent,
    timestamp: Date.now(),
    status: 'pending',
  };

  return {
    updatedCommands: [...commands, newCommand],
    newCommand,
  };
}

/**
 * Marks a queued command as executed.
 */
export function executeCommand(
  commands: AgentCommand[],
  commandId: string
): { updatedCommands: AgentCommand[]; executedCommand?: AgentCommand; error?: string } {
  const index = commands.findIndex((c) => c.id === commandId);
  if (index === -1) {
    return { updatedCommands: commands, error: `Command ${commandId} not found` };
  }

  const updated = [...commands];
  const executedCommand: AgentCommand = {
    ...updated[index],
    status: 'executed',
  };
  updated[index] = executedCommand;

  return { updatedCommands: updated, executedCommand };
}

/**
 * Calculates whether terminal auto-scroll should remain enabled based on scroll position.
 */
export function calculateAutoScrollState(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  threshold: number = 30
): boolean {
  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
  return distanceFromBottom <= threshold;
}

/**
 * Returns UI color classes and formatted strings for a given log type.
 */
export function formatLogLine(log: AgentLog): {
  formattedTimestamp: string;
  badgeColorClass: string;
  textColorClass: string;
} {
  const date = new Date(log.timestamp);
  const formattedTimestamp = date.toISOString().substring(11, 19);

  let badgeColorClass = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  let textColorClass = 'text-sky-300';

  if (log.type === 'stderr') {
    badgeColorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
    textColorClass = 'text-red-400';
  } else if (log.type === 'system') {
    badgeColorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    textColorClass = 'text-emerald-300';
  }

  return {
    formattedTimestamp,
    badgeColorClass,
    textColorClass,
  };
}
