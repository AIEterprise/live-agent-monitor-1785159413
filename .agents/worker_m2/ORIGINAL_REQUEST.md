## 2026-07-27T11:40:30Z
<USER_REQUEST>
You are Milestone 2 Worker for live_agent_monitor project.
Working directory: /data/data/com.termux/files/home/teamwork_projects/live_agent_monitor/.agents/worker_m2
Target project directory: /data/data/com.termux/files/home/teamwork_projects/live_agent_monitor

Your Task:
Implement Firebase Integration and Mock Payload Emitter Script according to R2 & R4 of /data/data/com.termux/files/home/teamwork_projects/live_agent_monitor/.agents/ORIGINAL_REQUEST.md.

Deliverables:
1. `lib/firebase.ts`: Configure Firebase app and Realtime Database / Firestore SDK initialization with support for environment variables (`NEXT_PUBLIC_FIREBASE_*`) and fallback mock DB instance when offline.
2. `database.rules.json` and `firebase.json`: Define Firebase database security rules allowing read/write on `logs`, `agents`, `commands`.
3. `scripts/emit-agent-logs.ts`: Runnable TypeScript script emitting mock Antigravity CLI agent logs (stdout, stderr, system), subagent telemetry cards data, and checking/updating queued commands.
4. Update `package.json` with `"emit-logs": "node --experimental-strip-types scripts/emit-agent-logs.ts"` (and/or `ts-node`).
5. Run and verify the script successfully writes log entries without permission errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, write handoff report in `/data/data/com.termux/files/home/teamwork_projects/live_agent_monitor/.agents/worker_m2/handoff.md` and send message to parent (ID: e6d33a76-3c1a-426f-b2b7-35f7a57f7cc7).
</USER_REQUEST>
