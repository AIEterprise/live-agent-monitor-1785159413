# Project: live_agent_monitor

## Architecture
Real-time monitoring web application for Google Antigravity CLI agent runs built with Next.js App Router, TypeScript, Tailwind CSS (v3.4), GSAP, Lenis, and Firebase Realtime Database / Cloud Firestore.

- **Frontend**: Next.js App Router, React 18/19, Tailwind CSS v3.4, GSAP, Lenis.
- **Design Palette**: Charcoal Black `#121212` / `#0A0A0A` base, Off-White `#F5F5F7` text/accents, Sea Green `#0EA5E9` / Mint Green `#10B981` status & terminal accents.
- **Backend / Realtime**: Firebase Realtime Database or Cloud Firestore (`lib/firebase.ts`), Firebase rules (`firebase.json`, `database.rules.json` or `firestore.rules`).
- **Telemetry Emitter**: Node/TypeScript script (`scripts/emit-agent-logs.ts`) using `ts-node` or `tsx` writing mock terminal execution logs, subagent process telemetry, and receiving queued commands.
- **Features**:
  1. Real-Time Execution Terminal Feed (color-coded stdout/stderr/system, auto-scroll, GSAP entrance/stream transitions).
  2. Agent & Subagent Telemetry Cards (live visual status pills: idle, running, success, error, memory/CPU metrics).
  3. Remote Agent Control Panel (queuing commands to Firebase `commands` node).
  4. Log Filter & Search Drawer (filter by log level, agent ID, regex, keyword search).
- **Deployment & Repo**: GitHub Repository, Vercel Deployment.

## Code Layout
```
/data/data/com.termux/files/home/teamwork_projects/live_agent_monitor/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── TerminalFeed.tsx
│   ├── TelemetryCards.tsx
│   ├── RemoteControlPanel.tsx
│   ├── SearchDrawer.tsx
│   └── SmoothScrollProvider.tsx
├── lib/
│   ├── firebase.ts
│   └── types.ts
├── scripts/
│   └── emit-agent-logs.ts
├── e2e/
│   └── monitor.spec.ts
├── firebase.json
├── database.rules.json
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite Track | Design and build E2E test runner, tests (Tiers 1-4: Feature, Boundary, Cross-Feature, Real-World), publish TEST_READY.md | none | DONE |
| 1 | Base Next.js & UI Infra | Scaffolding Next.js App Router project, Tailwind v3.4, GSAP, Lenis, TypeScript config, design tokens | none | DONE |
| 2 | Firebase Integration & Emitter Script | Firebase setup (`lib/firebase.ts`), rules, and `scripts/emit-agent-logs.ts` payload generator | M1 | IN_PROGRESS |
| 3 | Core UI Features | Terminal Feed, Telemetry Cards, Remote Control Panel, Search Drawer components & pages | M1, M2 | DONE |
| 4 | Integration, E2E Pass, GitHub & Vercel | Full end-to-end integration, passing all tests, git setup, GitHub repo, Vercel deployment | M1, M2, M3, E2E | PLANNED |

## Interface Contracts
### Client ↔ Firebase Realtime Data Structure
- `logs/{logId}`: `{ id: string, timestamp: number, agentId: string, type: 'stdout'|'stderr'|'system', message: string, status: string }`
- `agents/{agentId}`: `{ id: string, name: string, role: string, status: 'idle'|'running'|'completed'|'error', cpuUsage: number, memoryUsage: number, lastActive: number }`
- `commands/{cmdId}`: `{ id: string, command: string, agentId: string, timestamp: number, status: 'pending'|'executed' }`
