# Project Plan: live_agent_monitor

## Overview
Decompose the building of `live_agent_monitor` into parallel and sequential tracks following the Project Pattern dual-track execution model.

## Tracks & Milestones
1. **E2E Testing Track**:
   - Subagent: `teamwork_preview_explorer` / `teamwork_preview_worker` to create end-to-end tests covering Tiers 1-4.
   - Outputs: `TEST_INFRA.md` and `TEST_READY.md`.

2. **Implementation Track**:
   - **Milestone 1**: Scaffolding Next.js App Router project with TypeScript, Tailwind v3.4 (mandatory version lock), GSAP, Lenis, base layout and theme.
   - **Milestone 2**: Firebase Integration (`lib/firebase.ts`, security rules, mock setup) and mock payload emitter script (`scripts/emit-agent-logs.ts`).
   - **Milestone 3**: Core UI features:
     - Real-Time Execution Terminal Feed (color-coded, auto-scroll, GSAP entrance/stream transitions).
     - Agent & Subagent Telemetry Cards (live visual status pills).
     - Remote Agent Control Panel (writing to `commands` queue in Firebase).
     - Log Filter & Search Drawer (filter by level, agent, keyword, regex).
   - **Milestone 4**: Final integration, build verification (`npm run build` with 0 errors), testing verification, GitHub repo creation & Vercel deployment.

## Execution Strategy
- Dispatch specialized worker subagents for each milestone.
- Dispatch review subagents and forensic auditors for verification before closing each milestone gate.
- Ensure strict adherence to integrity checks (no cheating, genuine logic, real builds).
