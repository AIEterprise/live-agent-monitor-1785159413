'use client';

import React, { useState } from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Radio,
  Zap,
} from 'lucide-react';
import type { AgentTelemetry, AgentStatus } from '@/lib/types';

interface TelemetryCardsProps {
  agents: AgentTelemetry[];
  selectedAgentId?: string;
  onSelectAgent?: (agentId: string) => void;
}

export default function TelemetryCards({
  agents,
  selectedAgentId,
  onSelectAgent,
}: TelemetryCardsProps) {
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate summary metrics
  const totalAgents = agents.length;
  const runningCount = agents.filter((a) => a.status === 'running').length;
  const idleCount = agents.filter((a) => a.status === 'idle').length;
  const errorCount = agents.filter((a) => a.status === 'error').length;
  const completedCount = agents.filter((a) => a.status === 'completed').length;

  // Filter agents array
  const filteredAgents = agents.filter((agent) => {
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Helper for status pill formatting
  const renderStatusPill = (status: AgentStatus) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-mint/10 text-mint border border-mint/30 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            <span>RUNNING</span>
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sea/10 text-sea border border-sea/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sea" />
            <span>IDLE</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>ERROR</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Helper for relative time formatting
  const formatLastActive = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    if (secondsAgo < 5) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div id="telemetry" className="space-y-4">
      {/* Top Telemetry Summary Statistics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-charcoal-card border border-charcoal-border p-3.5 rounded-xl shadow-lg flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-sea/10 border border-sea/20 text-sea shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-offwhite-dim font-mono block">Total Agents</span>
            <span className="text-lg font-bold text-offwhite font-mono">{totalAgents}</span>
          </div>
        </div>

        <div className="bg-charcoal-card border border-charcoal-border p-3.5 rounded-xl shadow-lg flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-mint/10 border border-mint/20 text-mint shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-offwhite-dim font-mono block">Active Running</span>
            <span className="text-lg font-bold text-mint font-mono">{runningCount}</span>
          </div>
        </div>

        <div className="bg-charcoal-card border border-charcoal-border p-3.5 rounded-xl shadow-lg flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-sea/10 border border-sea/20 text-sea shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-offwhite-dim font-mono block">Idle / Ready</span>
            <span className="text-lg font-bold text-sea font-mono">{idleCount}</span>
          </div>
        </div>

        <div className="bg-charcoal-card border border-charcoal-border p-3.5 rounded-xl shadow-lg flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg border shrink-0 ${
            errorCount > 0
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {errorCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-[11px] text-offwhite-dim font-mono block">Alerts / Errors</span>
            <span className={`text-lg font-bold font-mono ${errorCount > 0 ? 'text-red-400' : 'text-offwhite'}`}>
              {errorCount}
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Section Box */}
      <div className="bg-charcoal-card border border-charcoal-border rounded-xl p-5 shadow-2xl space-y-4">
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-charcoal-border pb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-mint" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-offwhite">
                Agent & Subagent Telemetry
              </h2>
              <p className="text-xs text-offwhite-dim">
                Real-time process status, CPU utilization, and memory consumption metrics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-offwhite-dim" />
              <input
                type="text"
                placeholder="Search agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-charcoal border border-charcoal-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-offwhite focus:outline-none focus:border-sea font-mono placeholder:text-offwhite-dim/60"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center bg-charcoal p-1 rounded-lg border border-charcoal-border text-xs font-mono">
              {(['all', 'running', 'idle', 'completed', 'error'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-charcoal-surface text-sea font-bold border border-sea/30'
                      : 'text-offwhite-dim hover:text-offwhite'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Telemetry Cards Grid */}
        {filteredAgents.length === 0 ? (
          <div className="py-12 text-center text-offwhite-dim font-mono text-xs space-y-2">
            <Server className="w-8 h-8 mx-auto text-offwhite-dim/40" />
            <p>[SYSTEM] No telemetry cards match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              const cpuPercent = Math.min(100, Math.max(0, agent.cpuUsage || 0));
              const memoryMB = agent.memoryUsage || 0;
              // Max memory reference for bar width calculation (e.g. 512 MB reference)
              const memoryBarPercent = Math.min(100, (memoryMB / 512) * 100);

              return (
                <div
                  key={agent.id}
                  onClick={() => onSelectAgent && onSelectAgent(agent.id)}
                  className={`group relative bg-charcoal p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-sea bg-charcoal-surface/80 shadow-lg shadow-sea/10 ring-1 ring-sea'
                      : 'border-charcoal-border hover:border-charcoal-hover hover:bg-charcoal-surface/40'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-offwhite group-hover:text-sea transition-colors font-mono">
                          {agent.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-charcoal-surface text-offwhite-dim border border-charcoal-border">
                          {agent.role}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-offwhite-dim block mt-0.5">
                        ID: {agent.id}
                      </span>
                    </div>

                    {renderStatusPill(agent.status)}
                  </div>

                  {/* CPU Usage Metric */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-offwhite-muted flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-sea" /> CPU Usage
                      </span>
                      <span
                        className={`font-semibold ${
                          cpuPercent > 80
                            ? 'text-red-400'
                            : cpuPercent > 50
                            ? 'text-sea'
                            : 'text-mint'
                        }`}
                      >
                        {cpuPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-charcoal-card rounded-full overflow-hidden border border-charcoal-border/50">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          cpuPercent > 80
                            ? 'bg-red-500'
                            : cpuPercent > 50
                            ? 'bg-sea'
                            : 'bg-mint'
                        }`}
                        style={{ width: `${cpuPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Usage Metric */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-offwhite-muted flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-sea-light" /> Memory
                      </span>
                      <span className="font-semibold text-sea-light">
                        {memoryMB.toFixed(1)} MB
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-charcoal-card rounded-full overflow-hidden border border-charcoal-border/50">
                      <div
                        className="h-full bg-sea-light transition-all duration-500 rounded-full"
                        style={{ width: `${memoryBarPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Footer: Timestamp */}
                  <div className="pt-2.5 border-t border-charcoal-border/60 flex items-center justify-between text-[10px] font-mono text-offwhite-dim">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-offwhite-dim" />
                      <span>Last active:</span>
                    </span>
                    <span className="text-offwhite-muted">
                      {formatLastActive(agent.lastActive)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
