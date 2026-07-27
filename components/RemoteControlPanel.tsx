'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Terminal,
  XCircle,
} from 'lucide-react';
import type { AgentCommand, AgentTelemetry } from '@/lib/types';
import { enqueueCommand } from '@/lib/monitor-engine';
import { rtdb } from '@/lib/firebase';
import { ref, push } from 'firebase/database';

interface RemoteControlPanelProps {
  agents: AgentTelemetry[];
  selectedAgentId?: string;
  onSelectAgentId?: (agentId: string) => void;
  commands: AgentCommand[];
  onCommandSubmitted?: (newCommand: AgentCommand) => void;
}

export default function RemoteControlPanel({
  agents,
  selectedAgentId = '',
  onSelectAgentId,
  commands,
  onCommandSubmitted,
}: RemoteControlPanelProps) {
  const [targetAgentId, setTargetAgentId] = useState<string>(selectedAgentId || '');
  const [customCommand, setCustomCommand] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state if selectedAgentId prop changes from outside
  React.useEffect(() => {
    if (selectedAgentId) {
      setTargetAgentId(selectedAgentId);
    } else if (agents.length > 0 && !targetAgentId) {
      setTargetAgentId(agents[0].id);
    }
  }, [selectedAgentId, agents]);

  // Dispatch a command (preset or custom)
  const handleDispatchCommand = async (cmdString: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const activeAgent = targetAgentId || (agents.length > 0 ? agents[0].id : '');

    // Validate command input using engine helper
    const result = enqueueCommand(commands, {
      command: cmdString,
      agentId: activeAgent,
    });

    if (result.error) {
      setErrorMsg(result.error);
      return;
    }

    if (!result.newCommand) return;

    setIsSubmitting(true);

    try {
      // 1. Write to Firebase RTDB 'commands' node if available
      try {
        const commandsRef = ref(rtdb, 'commands');
        await push(commandsRef, result.newCommand);
      } catch (fbErr) {
        console.warn('[RemoteControlPanel] Firebase RTDB write skipped/fallback:', fbErr);
      }

      // 2. Notify parent / update local state
      if (onCommandSubmitted) {
        onCommandSubmitted(result.newCommand);
      }

      setSuccessMsg(`Queued '${cmdString}' for @${activeAgent}`);
      setCustomCommand('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to dispatch command');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleDispatchCommand(customCommand);
  };

  return (
    <div
      id="control"
      className="bg-charcoal-card border border-charcoal-border rounded-xl p-5 shadow-2xl space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-charcoal-border pb-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-sea-light" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-offwhite">
              Remote Agent Control Panel
            </h2>
            <p className="text-xs text-offwhite-dim">
              Dispatch execution commands directly to the Firebase command queue
            </p>
          </div>
        </div>
      </div>

      {/* Target Agent Selection & Command Dispatcher */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Target Agent Selector */}
        <div className="md:col-span-4 space-y-1.5 font-mono text-xs">
          <label className="block text-offwhite-muted font-medium">Target Agent ID</label>
          <select
            value={targetAgentId}
            onChange={(e) => {
              setTargetAgentId(e.target.value);
              if (onSelectAgentId) onSelectAgentId(e.target.value);
            }}
            className="w-full bg-charcoal border border-charcoal-border rounded-lg px-3 py-2 text-xs text-offwhite focus:outline-none focus:border-sea font-mono"
          >
            <option value="">-- Select Agent --</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (@{a.id}) [{a.status.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        {/* Quick Action Presets */}
        <div className="md:col-span-8 space-y-1.5 font-mono text-xs">
          <label className="block text-offwhite-muted font-medium">Quick Actions</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleDispatchCommand('Pause')}
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-sea/10 text-sea border border-sea/30 hover:bg-sea/20 active:scale-95 transition-all font-semibold"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>

            <button
              onClick={() => handleDispatchCommand('Resume')}
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-mint/10 text-mint border border-mint/30 hover:bg-mint/20 active:scale-95 transition-all font-semibold"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>

            <button
              onClick={() => handleDispatchCommand('Restart')}
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition-all font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            <button
              onClick={() => handleDispatchCommand('Kill')}
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-95 transition-all font-semibold"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Kill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Command Input Form */}
      <form onSubmit={handleCustomSubmit} className="space-y-2">
        <label className="block text-xs font-mono text-offwhite-muted font-medium">
          Custom CLI Command String
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1 font-mono text-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sea font-bold">
              $
            </span>
            <input
              type="text"
              placeholder="e.g. npm run test, git status, pkill worker"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              className="w-full bg-charcoal border border-charcoal-border rounded-lg pl-7 pr-3 py-2 text-xs text-offwhite focus:outline-none focus:border-sea font-mono placeholder:text-offwhite-dim/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !customCommand.trim()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-sea hover:bg-sea-light text-charcoal font-bold rounded-lg transition-colors font-mono text-xs disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enqueue</span>
          </button>
        </div>
      </form>

      {/* Feedback Banners */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs font-mono text-red-400 flex items-center space-x-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-mint/10 border border-mint/30 rounded-lg p-3 text-xs font-mono text-mint flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Command Queue History Feed */}
      <div className="space-y-2 border-t border-charcoal-border pt-4">
        <div className="flex items-center justify-between font-mono text-xs text-offwhite-muted">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sea" /> Command Queue Log
          </span>
          <span>{commands.length} enqueued</span>
        </div>

        {commands.length === 0 ? (
          <div className="bg-charcoal p-4 rounded-lg border border-charcoal-border text-center text-xs font-mono text-offwhite-dim">
            [SYSTEM] No remote control commands pending in queue.
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1.5 font-mono text-xs scrollbar-thin">
            {commands.slice().reverse().map((cmd) => (
              <div
                key={cmd.id}
                className="bg-charcoal p-2.5 rounded-lg border border-charcoal-border flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-sea font-bold">$</span>
                  <span className="font-semibold text-offwhite truncate">{cmd.command}</span>
                  <span className="text-[10px] text-offwhite-dim bg-charcoal-surface px-1.5 py-0.5 rounded border border-charcoal-border">
                    @{cmd.agentId}
                  </span>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-[10px]">
                  <span className="text-offwhite-dim flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span suppressHydrationWarning>{new Date(cmd.timestamp).toLocaleTimeString()}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded uppercase font-bold border ${
                      cmd.status === 'executed'
                        ? 'bg-mint/10 text-mint border-mint/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {cmd.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
