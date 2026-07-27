'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Clock,
  Terminal,
} from 'lucide-react';
import type { LogType, AgentTelemetry } from '@/lib/types';
import type { FilterOptions } from '@/lib/monitor-engine';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOptions;
  onChangeOptions: (newOptions: FilterOptions) => void;
  agents: AgentTelemetry[];
  totalLogCount: number;
  filteredLogCount: number;
  regexError?: string;
  onResetFilters: () => void;
}

export default function SearchDrawer({
  isOpen,
  onClose,
  options,
  onChangeOptions,
  agents,
  totalLogCount,
  filteredLogCount,
  regexError,
  onResetFilters,
}: SearchDrawerProps) {
  if (!isOpen) return null;

  const handleLevelChange = (level: LogType | 'all') => {
    onChangeOptions({ ...options, level });
  };

  const handleAgentIdChange = (agentId: string) => {
    onChangeOptions({ ...options, agentId });
  };

  const handleQueryChange = (searchQuery: string) => {
    onChangeOptions({ ...options, searchQuery });
  };

  const handleRegexToggle = () => {
    onChangeOptions({ ...options, useRegex: !options.useRegex });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-charcoal-card border-l border-charcoal-border shadow-2xl flex flex-col h-full z-10">
        {/* Drawer Header */}
        <div className="p-4 border-b border-charcoal-border flex items-center justify-between bg-charcoal">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-sea" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-offwhite">
              Log Filter & Search Drawer
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-charcoal-surface text-offwhite-dim hover:text-offwhite border border-charcoal-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 font-mono text-xs">
          {/* Matches Counter Summary */}
          <div className="bg-charcoal p-3.5 rounded-xl border border-charcoal-border flex items-center justify-between">
            <span className="text-offwhite-muted">Matching Results</span>
            <span className="px-2.5 py-1 rounded bg-sea/10 text-sea border border-sea/30 font-bold">
              {filteredLogCount} / {totalLogCount} logs
            </span>
          </div>

          {/* 1. Keyword / Regex Search Query Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-offwhite-muted font-bold flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sea" /> Search Pattern
              </label>
              <label className="flex items-center space-x-2 text-[11px] text-sea cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!options.useRegex}
                  onChange={handleRegexToggle}
                  className="rounded border-charcoal-border bg-charcoal text-sea focus:ring-0 cursor-pointer"
                />
                <span>Regex Mode</span>
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={options.useRegex ? 'Enter Regex e.g. ERROR.*(timeout|lost)' : 'Search keyword string...'}
                value={options.searchQuery || ''}
                onChange={(e) => handleQueryChange(e.target.value)}
                className={`w-full bg-charcoal border rounded-lg px-3 py-2 text-xs text-offwhite focus:outline-none font-mono ${
                  regexError ? 'border-red-500 text-red-300' : 'border-charcoal-border focus:border-sea'
                }`}
              />
              {options.searchQuery && (
                <button
                  onClick={() => handleQueryChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-offwhite-dim hover:text-offwhite"
                >
                  ×
                </button>
              )}
            </div>

            {regexError && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{regexError}</span>
              </div>
            )}
          </div>

          {/* 2. Filter by Log Level */}
          <div className="space-y-2">
            <label className="text-offwhite-muted font-bold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-mint" /> Log Level Filter
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'all', label: 'All Levels', color: 'border-sea/30 text-sea' },
                  { id: 'stdout', label: 'stdout', color: 'border-sky-500/30 text-sky-400' },
                  { id: 'stderr', label: 'stderr', color: 'border-red-500/30 text-red-400' },
                  { id: 'system', label: 'system', color: 'border-emerald-500/30 text-emerald-400' },
                ] as const
              ).map((lvl) => {
                const isActive = (options.level || 'all') === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => handleLevelChange(lvl.id)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      isActive
                        ? `bg-charcoal-surface border-sea text-offwhite shadow-sm ring-1 ring-sea/50`
                        : `bg-charcoal border-charcoal-border text-offwhite-dim hover:text-offwhite`
                    }`}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Filter by Target Agent ID */}
          <div className="space-y-2">
            <label className="text-offwhite-muted font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-sea-light" /> Target Agent Filter
            </label>
            <select
              value={options.agentId || ''}
              onChange={(e) => handleAgentIdChange(e.target.value)}
              className="w-full bg-charcoal border border-charcoal-border rounded-lg px-3 py-2 text-xs text-offwhite focus:outline-none focus:border-sea font-mono"
            >
              <option value="">-- All Agents --</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} (@{agent.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-charcoal-border bg-charcoal flex items-center justify-between">
          <button
            onClick={onResetFilters}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-charcoal-surface hover:bg-charcoal-hover text-offwhite-muted hover:text-offwhite border border-charcoal-border transition-colors font-mono text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-sea hover:bg-sea-light text-charcoal font-bold transition-colors font-mono text-xs"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
