# VIZRA AI Creative Studio — Operations, Backup, Monitoring, Disaster Recovery & Vercel Plan Runbook

> **Product**: VIZRA AI Creative Studio (`https://vizra.vercel.app/`)  
> **Hosting**: Vercel Hobby / Free  
> **Firebase Project**: `nice-dolphin-n7c1c`  
> **Firestore Database**: `ai-studio-vizraaicreatives-526756ea-8369-4e64-bb74-541d358e399a`  
> **Document Scope**: Phases 5, 7, 8, and 9 operational architecture, playbooks, and upgrade criteria.

---

## 1. Phase 5 — Firestore Backup, Retention & Restoration Architecture

### Current Status
- **Automated Firestore Backups**: `NOT IMPLEMENTED` (`REQUIRES PAID SERVICE` — Google Cloud Blaze billing + Cloud Storage bucket).
- **Point-in-Time Recovery (PITR)**: `NOT IMPLEMENTED` (`REQUIRES PAID SERVICE` + `REQUIRES MANUAL CONFIGURATION`).
- **Ephemeral Server JSON Stores (`data/*.json`)**: **HIGH-RISK DATA LOSS GAP on Vercel Hobby**. `server.ts` and `src/server/*` write to local files (`credit_ledger_store.json`, `workspace_tokens_store.json`, `submissions_store.json`, `deletion_audit_log.json`, `consent_store.json`, `omnia_learning_store.json`, `age_assurance_store.json`, `integrations_vault.json`). On Vercel Serverless, the deployment filesystem is read-only and `/tmp` is ephemeral per invocation/cold start. These stores **must be migrated to Firestore or a managed database** before treating credit ledgers, workspace tokens, consent audit records, or OAuth vaults as durable production data.

### Target Recovery Objectives
- **RPO (Recovery Point Objective)**: `<= 24 hours` (daily automated backups) or `<= 1 minute` with PITR enabled (`7-day` rolling window).
- **RTO (Recovery Time Objective)**: `<= 4 hours` (import into staging verification DB first, validate counts/integrity, then cut over or selectively restore).

### Backup Implementation Blueprint (Execute After Blaze Upgrade & Approval)
1. **Create a Dedicated Restricted GCS Backup Bucket** (separate region from primary Firestore DB for disaster isolation, Uniform Bucket-Level Access enabled, Public Access Prevention enforced, versioning + 30-day retention lock):
   ```bash
   gcloud storage buckets create gs://vizra-firestore-backups-prod \
     --project=nice-dolphin-n7c1c \
     --location=asia-south1 \
     --uniform-bucket-level-access \
     --public-access-prevention
   ```
2. **Enable 7-Day Point-in-Time Recovery (PITR)** on the named Firestore database:
   ```bash
   gcloud firestore databases update \
     --project=nice-dolphin-n7c1c \
     --database=ai-studio-vizraaicreatives-526756ea-8369-4e64-bb74-541d358e399a \
     --enable-pitr
   ```
3. **Create Daily + Weekly Native Firestore Backup Schedules** (retention: 14 weeks weekly, 7 days daily):
   ```bash
   gcloud firestore backups schedules create \
     --project=nice-dolphin-n7c1c \
     --database=ai-studio-vizraaicreatives-526756ea-8369-4e64-bb74-541d358e399a \
     --recurrence=daily \
     --retention=7d

   gcloud firestore backups schedules create \
     --project=nice-dolphin-n7c1c \
     --database=ai-studio-vizraaicreatives-526756ea-8369-4e64-bb74-541d358e399a \
     --recurrence=weekly \
     --day-of-week=SUN \
     --retention=14w
   ```
4. **Scheduled Off-Site GCS Export (Cloud Scheduler -> Managed Export)** for portable JSON/LevelDB recovery and compliance archiving.
5. **Monthly Non-Production Restore Verification Drill**:
   - Restore the latest backup into a temporary staging database `vizra-restore-drill-YYYYMM` (NEVER overwrite production directly).
   - Verify document counts across `/users`, `/users/*/projects`, and `/users/*/conversations/*/messages`.
   - Record RTO elapsed time and delete the temporary drill database after sign-off.

---

## 2. Phase 7 — Error Monitoring, Observability & Alerting Blueprint

### Current Implementation Status
- **Structured JSON Server Logging**: `VERIFIED` (`src/server/observability.ts`, now with masked client IPs and `X-Request-Id` correlation).
- **In-Process Telemetry & Health Endpoints**: `VERIFIED` (`GET /api/health`, admin-gated `GET /api/metrics`, filtered `GET /api/system-logs`). Note: In-memory metrics reset on every Vercel Serverless cold start!
- **Web Analytics**: `VERIFIED` (`@vercel/analytics` installed).
- **Error Tracking (Sentry / Equivalent)**: `NOT IMPLEMENTED` (`REQUIRES MANUAL CONFIGURATION`).
- **External Uptime Monitoring & Alert Routing**: `NOT IMPLEMENTED` (`REQUIRES MANUAL CONFIGURATION`).

### Recommended Production Monitoring Stack
1. **Frontend & Serverless Error Tracking (Sentry Free/Team Tier)**:
   - Install `@sentry/react` (wrap `ErrorBoundary` in `src/App.tsx`) and `@sentry/node` (wrap Express error handler in `server.ts`).
   - Configure `beforeSend` scrubbing to strip `Authorization`, `X-Admin-Key`, `X-Vizra-Client-Id`, raw user prompts, emails, and cookies.
   - Upload source maps privately to Sentry CI only (`build.sourcemap: 'hidden'` during CI upload; never serve `.map` publicly).
2. **External Uptime & Synthetic Probes** (Better Stack / UptimeRobot / Checkly):
   - Probe `GET https://vizra.vercel.app/` (expect HTTP 200, `< 1500ms`) every 60s.
   - Probe `GET https://vizra.vercel.app/api/health` (expect HTTP 200 + `status: "ok"`) every 60s.
3. **Alert Thresholds**:
   | Signal | Warning Threshold | Critical Pager Threshold | Channel |
   | --- | --- | --- | --- |
   | API 5xx error rate | `> 1%` over 5 min | `> 5%` over 5 min | Email + Slack/Pager |
   | API p95 latency (non-AI) | `> 800 ms` | `> 2,500 ms` | Email + Slack |
   | AI generation failure/fallback rate | `> 5%` over 10 min | `> 20%` over 5 min | Email + Slack |
   | Auth failure / admin lockout spikes | `>= 5` lockouts / 15 min | `>= 20` lockouts / 15 min | Security Alert Email |
   | Gemini API / Firebase quota usage | `>= 75%` daily quota | `>= 90%` daily quota | Billing + Ops Email |

---

## 3. Phase 8 — Disaster Recovery Playbooks (9 Incident Scenarios)

### Scenario 1: Firebase / Firestore Outage
- **Detection**: Synthetic monitor or client Firestore `unavailable` / `deadline-exceeded` spike; check `https://status.firebase.google.com/`.
- **Containment**: App already degrades gracefully on client (`Firestore` read errors caught, auth state preserved); avoid destructive retries.
- **Recovery**: Monitor Google Cloud status; once restored, verify `GET /api/health` and Firestore sync in staging, then communicate resolution.

### Scenario 2: Database Corruption (Bad Migration / Logic Bug)
- **Detection**: Elevated schema errors, malformed document reports, or unexpected null fields.
- **Containment**: Immediately roll back the faulty Vercel deployment (`vercel rollback`) to halt further corrupt writes.
- **Recovery**: Use Firestore PITR (once enabled) to export/restore to a staging DB at `T - 5 minutes` before the bad deploy, diff corrupted documents, and run a targeted idempotent repair script.

### Scenario 3: Accidental Data Deletion
- **Detection**: Missing user projects/conversations or dropped collection alert.
- **Containment**: Pause any deletion jobs or admin scripts immediately.
- **Recovery**: Restore from PITR or latest daily backup into a temporary staging database, verify target user documents, and copy only the deleted records back into production.

### Scenario 4: Vercel Hosting Outage
- **Detection**: External uptime check failure on `https://vizra.vercel.app/`; check `https://www.vercel-status.com/`.
- **Containment**: Communicate degraded status to users; verify no DNS misconfiguration.
- **Recovery**: Because VIZRA already runs as a standard Node/Express (`server.ts`) + Vite static app, a standby container deployment on Google Cloud Run (`Dockerfile` / `npm run build && npm start`) can serve production within 15–30 minutes if an extended Vercel outage occurs.

### Scenario 5: Failed Deployment / Regression
- **Detection**: Post-deploy smoke test failure, 5xx spike, or broken SPA route.
- **Containment & Recovery**: Instant rollback in Vercel Dashboard (`Deployments -> Previous Healthy Production Build -> Promote to Production`) — RTO `< 2 minutes`. Root-cause locally before re-deploying.

### Scenario 6: Compromised Credentials / API Key Leak
- **Detection**: Unexpected Gemini/Resend quota spike, admin lockout alert, or secret scanner notification.
- **Containment (< 10 min)**:
  1. Immediately rotate `GEMINI_API_KEY` in Google AI Studio / GCP Console and update Vercel Environment Variables.
  2. Rotate `ADMIN_API_KEY`, `PAYMENT_WEBHOOK_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, and `INTEGRATION_TOKEN_SECRET` (move old key to `INTEGRATION_TOKEN_SECRET_PREVIOUS` / `SESSION_HASH_SECRET_PREVIOUS` to rotate gracefully, or drop previous key if vault compromise is confirmed).
  3. Revoke compromised OAuth client secrets in provider consoles (Google/GitHub/Notion/Figma/Canva).
  4. Redeploy Vercel production to pick up rotated env vars immediately.
  5. Audit Firebase Auth users and `/api/metrics` / Vercel Runtime Logs for unauthorized access window.

### Scenario 7: AI Provider (Gemini) Outage or Quota Exhaustion
- **Detection**: `provider5xxCount` or `providerThrottleCount` surge in observability metrics.
- **Containment**: `server.ts` already implements bounded concurrency (`chatTrafficController`), circuit-breaking/backoff retries, model fallbacks (`gemini-2.5-flash` fallback chain), and sanitized error messaging.
- **Recovery**: Verify GCP/Gemini quota limits, enable higher tier billing if quota-bound, and confirm fallback rate drops to `< 1%`.

### Scenario 8: Traffic Overload / DDoS Spike
- **Detection**: Surge in HTTP 429 (`RATE_LIMIT_EXCEEDED`), Vercel invocation spike, or elevated p95 latency.
- **Containment**:
  1. Enable Vercel Attack Challenge Mode / Firewall IP rules in Vercel Dashboard.
  2. Note that Express in-memory rate limiters (`SlidingWindowRateLimiter`) are per-serverless-instance on Vercel — for distributed DDoS protection, place Upstash Redis rate limiting or Vercel Firewall rules in front of `/api/*`.
  3. Temporarily tighten concurrency limits on `/api/chat` and `/api/music/generate`.

### Scenario 9: Backup Restoration Failure
- **Detection**: Monthly restore drill fails or backup checksum/collection count mismatch.
- **Containment**: Immediately trigger an ad-hoc Firestore managed export to secondary GCS bucket (`gs://vizra-firestore-backups-prod`).
- **Recovery**: Inspect IAM permissions (`roles/datastore.importExportAdmin`), verify Firestore indexes/schema compatibility, re-test restore in staging, and do not close incident until a full green restore drill succeeds.

---

## 4. Phase 9 — Vercel Hobby / Free Plan Infrastructure Audit

| Dimension | Vercel Hobby Limit / Behavior | Impact on VIZRA | Upgrade Trigger (Move to Pro / Dedicated) |
| --- | --- | --- | --- |
| **Commercial Terms** | Strictly non-commercial / personal hobby use | **Legal/ToS Blocker** once monetizing Pro/Studio plans or paid sponsorships (VIZRA Engage) | **Before accepting first paid customer or commercial ad revenue** |
| **Serverless Function Timeout** | 10s default (up to 60s with Fluid Compute / config; currently `vercel.json` does not set `maxDuration`) | Deep research (`/api/research`), Lyria music generation (`/api/music/generate`), and long Omnia streams can exceed 10s and return `504 FUNCTION_INVOCATION_TIMEOUT` | Immediately configure `maxDuration` or move long-running AI streams to Pro (up to 300s) / Cloud Run |
| **WebSockets (`/live`)** | **Unsupported** on Vercel Serverless Functions (`api/[...path].ts` has no persistent HTTP upgrade socket) | Gemini Live Voice (`/live` WebSocket) works on Node/Cloud Run (`server.ts`), **will fail on Vercel Hobby/Pro serverless** | Host `/live` WebSocket service on Cloud Run / Fly.io / Railway |
| **Filesystem Persistence (`data/*.json`)** | Read-only deployment bundle; ephemeral `/tmp` lost on cold starts | Credit ledger, workspace API tokens, consent logs, age-assurance blocks, OAuth vault, and Omnia learning store do **not** persist reliably across serverless cold starts | Migrate all `data/*.json` stores to Firestore or Upstash Redis / Postgres |
| **In-Memory Rate Limiters & Lockout Tracker** | Isolated per Lambda container; reset on cold start | Distributed attackers hitting multiple cold containers can multiply effective rate limits | Back `SlidingWindowRateLimiter` & `AuthLockoutTracker` with Upstash Redis + Vercel Firewall |
| **Bandwidth & Invocations** | 100 GB Fast Data Transfer/mo, 1M Fluid/edge invocations, 100k function invocations (varies by plan revisions), max 2 cron jobs (once/day) | Supports early beta (< ~1,000 DAU); cannot sustain 10,000+ concurrent users | Upgrade to Vercel Pro + dedicated API backend when DAU > 1,000 or AI requests > 5,000/day |
| **Cold Starts** | Node Express bundle (`server.ts` + `@google/genai` + dependencies) cold-starts on idle periods | First API request after idle adds ~300–1500ms latency | Keep API routes modular or run min-instance=1 on Cloud Run |
