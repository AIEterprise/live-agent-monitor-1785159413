'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Terminal,
  ArrowDown,
  Trash2,
  Download,
  Copy,
  Check,
  Radio,
  Filter,
  XCircle,
} from 'lucide-react';
import type { AgentLog } from '@/lib/types';
import { calculateAutoScrollState, formatLogLine } from '@/lib/monitor-engine';

interface TerminalFeedProps {
  logs: AgentLog[];
  onClearLogs?: () => void;
  selectedAgentId?: string;
  onSelectAgentId?: (agentId: string) => void;
  regexError?: string;
}

export default function TerminalFeed({
  logs,
  onClearLogs,
  selectedAgentId,
  onSelectAgentId,
  regexError,
}: TerminalFeedProps) {
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const linesContainerRef = useRef<HTMLDivElement>(null);
  const prevLogCountRef = useRef<number>(0);

  // 1. Scroll Event Listener to recalculate autoScroll state
  const handleScroll = () => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isAtBottom = calculateAutoScrollState(scrollTop, scrollHeight, clientHeight, 40);
    if (isAtBottom !== autoScroll) {
      setAutoScroll(isAtBottom);
    }
  };

  // 2. Auto-scroll to bottom when new logs arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 3. GSAP entrance transition for streaming new lines
  useEffect(() => {
    if (!linesContainerRef.current) return;

    if (logs.length > prevLogCountRef.current) {
      const lineElements = linesContainerRef.current.querySelectorAll('.log-line-item');
      const newlyAddedCount = logs.length - prevLogCountRef.current;
      const targetElements = Array.from(lineElements).slice(-newlyAddedCount);

      if (targetElements.length > 0) {
        gsap.fromTo(
          targetElements,
          { opacity: 0, x: -8, scaleY: 0.95 },
          {
            opacity: 1,
            x: 0,
            scaleY: 1,
            duration: 0.25,
            stagger: 0.03,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          }
        );
      }
    }
    prevLogCountRef.current = logs.length;
  }, [logs]);

  // Scroll to bottom manually on button click
  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setAutoScroll(true);
    }
  };

  // Copy logs text to clipboard
  const handleCopyLogs = () => {
    const textContent = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toISOString()}] [${l.type.toUpperCase()}] [${l.agentId}]: ${l.message}`
      )
      .join('\n');
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export logs to text file download
  const handleExportLogs = () => {
    const textContent = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toISOString()}] [${l.type.toUpperCase()}] [${l.agentId}]: ${l.message}`
      )
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-execution-logs-${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="terminal"
      className="bg-charcoal-card border border-charcoal-border rounded-xl shadow-2xl flex flex-col h-[560px] overflow-hidden"
    >
      {/* Header Bar */}
      <div className="bg-charcoal/90 border-b border-charcoal-border px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-mint/80 inline-block" />
          </div>
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-sea" />
            <h2 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-offwhite">
              Terminal Feed
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-charcoal-surface text-offwhite-muted border border-charcoal-border">
            {logs.length} {logs.length === 1 ? 'line' : 'lines'}
          </span>
          {selectedAgentId && (
            <div className="flex items-center space-x-1 bg-sea/10 border border-sea/30 text-sea text-xs px-2 py-0.5 rounded font-mono">
              <Filter className="w-3 h-3" />
              <span>Agent: {selectedAgentId}</span>
              {onSelectAgentId && (
                <button
                  onClick={() => onSelectAgentId('')}
                  className="ml-1 text-sea hover:text-white"
                  title="Clear agent filter"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          {/* Auto-Scroll Toggle & Status Indicator */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border transition-all ${
              autoScroll
                ? 'bg-mint/10 text-mint border-mint/30 hover:bg-mint/20'
                : 'bg-charcoal-surface text-offwhite-dim border-charcoal-border hover:text-offwhite'
            }`}
            title="Toggle Auto-Scroll"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoScroll ? 'bg-mint animate-pulse' : 'bg-offwhite-dim'
              }`}
            />
            <span>AUTO-SCROLL: {autoScroll ? 'ON' : 'PAUSED'}</span>
          </button>

          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-sea/10 text-sea border border-sea/30 hover:bg-sea/20"
              title="Jump to latest output"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bottom</span>
            </button>
          )}

          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded bg-charcoal-surface hover:bg-charcoal-hover text-offwhite-muted hover:text-offwhite border border-charcoal-border disabled:opacity-40"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-mint" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded bg-charcoal-surface hover:bg-charcoal-hover text-offwhite-muted hover:text-offwhite border border-charcoal-border disabled:opacity-40"
            title="Export logs as file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="p-1.5 rounded bg-charcoal-surface hover:bg-red-500/20 text-offwhite-muted hover:text-red-400 border border-charcoal-border disabled:opacity-40 transition-colors"
              title="Clear terminal feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Regex Error Alert Banner if active */}
      {regexError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-xs font-mono text-red-400 flex items-center space-x-2">
          <XCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{regexError}</span>
        </div>
      )}

      {/* Terminal Viewport */}
      <div
        ref={terminalRef}
        onScroll={handleScroll}
        className="flex-1 bg-charcoal p-4 overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed space-y-1 select-text scrollbar-thin"
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-offwhite-dim">
            <Radio className="w-8 h-8 text-sea/40 animate-pulse" />
            <p className="font-mono text-xs">
              [SYSTEM] Telemetry feed initialized. Awaiting execution stream...
            </p>
            <p className="text-[11px] text-offwhite-dim/60">
              Run <code className="text-sea">npm run emit</code> or start agent workflows to view output.
            </p>
          </div>
        ) : (
          <div ref={linesContainerRef} className="space-y-1.5">
            {logs.map((log, index) => {
              const { formattedTimestamp, badgeColorClass, textColorClass } = formatLogLine(log);

              return (
                <div
                  key={log.id || `log-${index}`}
                  className="log-line-item group flex flex-col sm:flex-row items-start sm:items-baseline hover:bg-charcoal-hover/60 px-2 py-1 rounded transition-colors"
                >
                  {/* Line Number & Timestamp */}
                  <div className="flex items-center space-x-2 shrink-0 select-none mr-2 font-mono text-[11px] text-offwhite-dim/60">
                    <span className="w-8 text-right text-offwhite-dim/40 font-mono">
                      {index + 1}
                    </span>
                    <span>[{formattedTimestamp}]</span>
                  </div>

                  {/* Badges & Content */}
                  <div className="flex flex-wrap items-baseline gap-2 flex-1 min-w-0">
                    {/* Log Level Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border shrink-0 ${badgeColorClass}`}
                    >
                      {log.type}
                    </span>

                    {/* Agent ID Badge */}
                    <button
                      onClick={() => onSelectAgentId && onSelectAgentId(log.agentId)}
                      className="text-[11px] font-mono text-sea/80 hover:text-sea hover:underline shrink-0 bg-sea/5 px-1 rounded border border-sea/10"
                      title={`Filter by ${log.agentId}`}
                    >
                      @{log.agentId}
                    </button>

                    {/* Log Message Text */}
                    <span className={`break-words whitespace-pre-wrap ${textColorClass}`}>
                      {log.message}
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
