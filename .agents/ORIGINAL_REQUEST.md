# Original User Request

## Initial Request — 2026-07-27T11:24:28Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Build a high-performance, real-time monitoring web application that tracks, streams, and controls local terminal execution logs, subagent process states, and system telemetry from Google Antigravity CLI agent runs.

Working directory: ~/teamwork_projects/live_agent_monitor
Integrity mode: development

## Requirements

### R1. Next.js & UI Architecture
Build a Next.js (App Router, TypeScript, Tailwind CSS) application. Apply a high-end minimalist modern design with Charcoal Black/Off-White base and Sea Green/Mint Green accents. Integrate GSAP for animations and Lenis for smooth scrolling. Do not use garish neon colors.

### R2. Firebase Real-Time Integration
Use Firebase Realtime Database or Cloud Firestore (Spark plan). Use the Firebase MCP Server and Firebase CLI to configure the project, define security rules, and generate the client SDK config (`lib/firebase.ts`). 

### R3. Core Features
Implement:
1. Real-Time Execution Terminal Feed (color-coded, auto-scroll, GSAP transitions).
2. Agent & Subagent Telemetry Cards (live visual status pills).
3. Remote Agent Control Panel (writing to a `commands` queue in Firebase).
4. Log Filter & Search Drawer.

### R4. Deployment & Infrastructure
Initialize a GitHub repository. Create a mock payload emitter script (`scripts/emit-agent-logs.ts`). Deploy the application to Vercel.

## Acceptance Criteria

### Next.js Build
- [ ] `npm run build` completes with 0 TypeScript and ESLint errors.

### Firebase Integration
- [ ] Running `ts-node scripts/emit-agent-logs.ts` (or similar) successfully writes a mock log entry to the configured Firebase database without permission errors.

### Deployment
- [ ] Vercel deployment succeeds and the live Vercel URL is accessible (returns a 200 OK status code).
- [ ] GitHub repository is created, pushed to, and accessible.
