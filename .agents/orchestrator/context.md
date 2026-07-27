# Context Memory: live_agent_monitor

## Project Objective
Build a high-performance real-time monitoring web application (`live_agent_monitor`) tracking terminal logs, subagent process telemetry, and control commands from Google Antigravity CLI agent runs.

## Key Technical Specifications
- Next.js (App Router, TypeScript)
- Tailwind CSS locked to version 3.4 (per user rules: lock Tailwind 3.4 in package.json)
- Animation & Motion: GSAP for component/terminal transitions, Lenis for smooth scrolling
- Color Scheme: Charcoal Black (`#121212` / `#0A0A0A`), Off-White (`#F5F5F7`), Sea Green (`#0EA5E9`), Mint Green (`#10B981`)
- Database: Firebase Realtime Database or Cloud Firestore (`lib/firebase.ts`), configured rules
- Core Features:
  1. Real-Time Terminal Feed (color-coded, auto-scroll, GSAP transitions)
  2. Agent Telemetry Cards (live visual status pills, memory/CPU metrics)
  3. Remote Agent Control Panel (writing to `commands` queue in Firebase)
  4. Log Filter & Search Drawer (log level, agent ID, keyword/regex filter)
- Emitter Script: `scripts/emit-agent-logs.ts` (runnable with `ts-node` / `tsx` writing mock logs)
- Deployment & Infra: Vercel deployment, GitHub repository setup

## Rules & Constraints
- DISPATCH ONLY for Orchestrator: do not write project code directly or run build/test commands directly.
- All code work must be dispatched to subagents (`teamwork_preview_worker`, `teamwork_preview_explorer`, `teamwork_preview_reviewer`, `teamwork_preview_challenger`, `teamwork_preview_auditor`).
- Pass criteria: `npm run build` 0 TS/ESLint errors, script writes to Firebase, Vercel deploy 200 OK, GitHub repo created & accessible.
