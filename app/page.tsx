'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sliders,
  Terminal,
  Cpu,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Zap,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import TerminalFeed from '@/components/TerminalFeed';
import TelemetryCards from '@/components/TelemetryCards';
import RemoteControlPanel from '@/components/RemoteControlPanel';
import SearchDrawer from '@/components/SearchDrawer';
import type { AgentLog, AgentTelemetry, AgentCommand } from '@/lib/types';
import { filterLogs, updateTelemetry, FilterOptions } from '@/lib/monitor-engine';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

// Initial Mock Seed Data
const INITIAL_AGENTS: AgentTelemetry[] = [
  {
    id: 'orch_main',
    name: 'Main Orchestrator',
    role: 'orchestrator',
    status: 'running',
    cpuUsage: 28.4,
    memoryUsage: 142.8,
    lastActive: Date.now() - 1000,
  },
  {
    id: 'worker_m1',
    name: 'UI Worker M1',
    role: 'worker',
    status: 'running',
    cpuUsage: 45.2,
    memoryUsage: 210.5,
    lastActive: Date.now() - 2000,
  },
  {
    id: 'worker_m2',
    name: 'Firebase Worker M2',
    role: 'worker',
    status: 'idle',
    cpuUsage: 0.0,
    memoryUsage: 84.2,
    lastActive: Date.now() - 15000,
  },
  {
    id: 'qa_specialist',
    name: 'QA Auditor',
    role: 'specialist',
    status: 'completed',
    cpuUsage: 0.0,
    memoryUsage: 64.0,
    lastActive: Date.now() - 45000,
  },
];

const INITIAL_LOGS: AgentLog[] = [
  {
    id: 'log_init_1',
    timestamp: Date.now() - 60000,
    agentId: 'orch_main',
    type: 'system',
    message: 'Antigravity Agent Execution Engine initialized. Firebase Realtime DB connected.',
  },
  {
    id: 'log_init_2',
    timestamp: Date.now() - 45000,
    agentId: 'worker_m1',
    type: 'stdout',
    message: 'Compiling Next.js App Router components and Tailwind CSS design tokens...',
  },
  {
    id: 'log_init_3',
    timestamp: Date.now() - 30000,
    agentId: 'worker_m1',
    type: 'stdout',
    message: 'GSAP streaming line entrance transitions & Lenis smooth scroll active.',
  },
  {
    id: 'log_init_4',
    timestamp: Date.now() - 20000,
    agentId: 'worker_m2',
    type: 'stderr',
    message: 'Notice: Memory usage threshold nominal (84.2 MB). Ready for commands.',
  },
  {
    id: 'log_init_5',
    timestamp: Date.now() - 10000,
    agentId: 'qa_specialist',
    type: 'system',
    message: 'Verification pass complete: 28/28 E2E tests verified across Tiers 1-4.',
  },
];

export default function HomePage() {
  const [logs, setLogs] = useState<AgentLog[]>(INITIAL_LOGS);
  const [agents, setAgents] = useState<AgentTelemetry[]>(INITIAL_AGENTS);
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Search & Filter Options state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    level: 'all',
    agentId: '',
    searchQuery: '',
    useRegex: false,
  });

  // Keep filterOptions.agentId in sync with selectedAgentId if set
  useEffect(() => {
    setFilterOptions((prev) => ({
      ...prev,
      agentId: selectedAgentId,
    }));
  }, [selectedAgentId]);

  // Subscribe to Firebase RTDB updates if active
  useEffect(() => {
    try {
      const logsRef = ref(rtdb, 'logs');
      const unsubscribeLogs = onValue(
        logsRef,
        (snapshot: any) => {
          const val = snapshot.val();
          if (val) {
            const list: AgentLog[] = Array.isArray(val)
              ? val
              : Object.keys(val).map((k) => ({ ...val[k], id: k }));
            if (list.length > 0) {
              setLogs(list);
            }
          }
        },
        (error: any) => {
          console.warn('[Firebase RTDB] Logs snapshot subscription error:', error);
        }
      );

      const agentsRef = ref(rtdb, 'agents');
      const unsubscribeAgents = onValue(
        agentsRef,
        (snapshot: any) => {
          const val = snapshot.val();
          if (val) {
            const list: AgentTelemetry[] = Array.isArray(val)
              ? val
              : Object.keys(val).map((k) => ({ ...val[k], id: k }));
            if (list.length > 0) {
              setAgents(list);
            }
          }
        },
        (error: any) => {
          console.warn('[Firebase RTDB] Agents snapshot subscription error:', error);
        }
      );

      const commandsRef = ref(rtdb, 'commands');
      const unsubscribeCommands = onValue(
        commandsRef,
        (snapshot: any) => {
          const val = snapshot.val();
          if (val) {
            const list: AgentCommand[] = Array.isArray(val)
              ? val
              : Object.keys(val).map((k) => ({ ...val[k], id: k }));
            setCommands(list);
          }
        },
        (error: any) => {
          console.warn('[Firebase RTDB] Commands snapshot subscription error:', error);
        }
      );

      return () => {
        off(logsRef, 'value', unsubscribeLogs);
        off(agentsRef, 'value', unsubscribeAgents);
        off(commandsRef, 'value', unsubscribeCommands);
      };
    } catch (e) {
      console.warn('[Firebase RTDB] Local fallback active for RTDB subscriptions');
    }
  }, []);

  // Filter logs using monitor-engine helper
  const { filtered: filteredLogs, regexError } = filterLogs(logs, filterOptions);

  // Clear logs feed
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Enqueue command handler
  const handleCommandSubmitted = (newCmd: AgentCommand) => {
    setCommands((prev) => [...prev, newCmd]);

    // Append system log to feed
    const sysLog: AgentLog = {
      id: `cmd_log_${Date.now()}`,
      timestamp: Date.now(),
      agentId: newCmd.agentId,
      type: 'system',
      message: `Remote command dispatched: '${newCmd.command}' -> status set to pending.`,
    };
    setLogs((prev) => [...prev, sysLog]);

    // Synchronize telemetry state based on command type
    if (newCmd.command.toLowerCase() === 'pause') {
      setAgents((prev) =>
        updateTelemetry(prev, { id: newCmd.agentId, status: 'idle', cpuUsage: 0.0 })
      );
    } else if (newCmd.command.toLowerCase() === 'resume' || newCmd.command.toLowerCase() === 'restart') {
      setAgents((prev) =>
        updateTelemetry(prev, { id: newCmd.agentId, status: 'running', cpuUsage: 32.5 })
      );
    } else if (newCmd.command.toLowerCase() === 'kill') {
      setAgents((prev) =>
        updateTelemetry(prev, { id: newCmd.agentId, status: 'error', cpuUsage: 0.0 })
      );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero / System Status Header Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-charcoal-card border border-charcoal-border p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-sea/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-8 w-72 h-72 bg-mint/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sea/10 border border-sea/20 text-sea text-xs font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Google Antigravity CLI Execution Engine</span>
            </div>

            {/* Log Search Drawer Open Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-charcoal-surface hover:bg-charcoal-hover text-offwhite border border-charcoal-border transition-all font-mono text-xs shadow-md"
            >
              <SlidersHorizontal className="w-4 h-4 text-sea" />
              <span>Search & Filter Drawer</span>
              {(filterOptions.level !== 'all' || filterOptions.searchQuery || selectedAgentId) && (
                <span className="w-2 h-2 rounded-full bg-mint animate-ping" />
              )}
            </button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-offwhite">
            Real-Time Agent Execution & Telemetry Dashboard
          </h1>

          <p className="text-offwhite-muted max-w-3xl text-sm sm:text-base leading-relaxed">
            Monitor Google Antigravity agent process logs in real-time with color-coded stdout/stderr,
            track memory & CPU telemetry, and queue remote control commands via Firebase.
          </p>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-charcoal-border/60">
            <div className="bg-charcoal/80 p-3 rounded-xl border border-charcoal-border font-mono">
              <span className="text-[11px] text-offwhite-dim block">Stream Status</span>
              <span className="text-xs font-semibold text-mint flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                Streaming Live
              </span>
            </div>

            <div className="bg-charcoal/80 p-3 rounded-xl border border-charcoal-border font-mono">
              <span className="text-[11px] text-offwhite-dim block">Visible Logs</span>
              <span className="text-xs font-semibold text-offwhite mt-1 block">
                {filteredLogs.length} / {logs.length}
              </span>
            </div>

            <div className="bg-charcoal/80 p-3 rounded-xl border border-charcoal-border font-mono">
              <span className="text-[11px] text-offwhite-dim block">Active Agents</span>
              <span className="text-xs font-semibold text-sea flex items-center gap-1 mt-1">
                <Cpu className="w-3.5 h-3.5" /> {agents.length} Processed
              </span>
            </div>

            <div className="bg-charcoal/80 p-3 rounded-xl border border-charcoal-border font-mono">
              <span className="text-[11px] text-offwhite-dim block">Commands Queue</span>
              <span className="text-xs font-semibold text-mint flex items-center gap-1 mt-1">
                <Zap className="w-3.5 h-3.5" /> {commands.length} Enqueued
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Terminal Feed & Remote Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Feed (8 cols on large screens) */}
        <div className="lg:col-span-8">
          <TerminalFeed
            logs={filteredLogs}
            onClearLogs={handleClearLogs}
            selectedAgentId={selectedAgentId}
            onSelectAgentId={(id) => setSelectedAgentId(id)}
            regexError={regexError}
          />
        </div>

        {/* Remote Agent Control Panel (4 cols on large screens) */}
        <div className="lg:col-span-4">
          <RemoteControlPanel
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgentId={(id) => setSelectedAgentId(id)}
            commands={commands}
            onCommandSubmitted={handleCommandSubmitted}
          />
        </div>
      </div>

      {/* Agent Telemetry Cards Section */}
      <TelemetryCards
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(id) => setSelectedAgentId(id === selectedAgentId ? '' : id)}
      />

      {/* Search Drawer Overlay Component */}
      <SearchDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        options={filterOptions}
        onChangeOptions={setFilterOptions}
        agents={agents}
        totalLogCount={logs.length}
        filteredLogCount={filteredLogs.length}
        regexError={regexError}
        onResetFilters={() => {
          setFilterOptions({ level: 'all', agentId: '', searchQuery: '', useRegex: false });
          setSelectedAgentId('');
        }}
      />
    </div>
  );
}
