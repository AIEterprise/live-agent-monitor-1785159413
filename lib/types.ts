export type LogType = 'stdout' | 'stderr' | 'system';
export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';
export type CommandStatus = 'pending' | 'executed';

export interface AgentLog {
  id: string;
  timestamp: number;
  agentId: string;
  type: LogType;
  message: string;
  status?: string;
}

export interface AgentTelemetry {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  cpuUsage: number;
  memoryUsage: number;
  lastActive: number;
}

export interface AgentCommand {
  id: string;
  command: string;
  agentId: string;
  timestamp: number;
  status: CommandStatus;
}
