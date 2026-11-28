# VIZRA AI Creative Studio — Security, Infrastructure & Production Reliability Walkthrough

# Security Summary

A full-stack application security, Firebase architecture, cryptography, observability, and production reliability audit was executed across the VIZRA frontend, Express backend (`server.ts` and `src/server/*`), OAuth integration vault, Firestore & Realtime Database security rules, Vercel deployment configuration, and npm/bun dependencies.

## Key Hardening Changes Implemented

| Finding | Area | Severity | Resolution |
| --- | --- | --- | --- |
| **VIZ-001** | Firebase ID Token Verification | **Critical** | Removed the non-production signature verification fallback in `src/server/authVerification.ts` so token validation always fails closed when Google signing certificates are unavailable or `kid` is unknown. Tightened `emailVerified` from `!== false` to strict `=== true` across `authVerification.ts`, `security.ts`, and `engageRoutes.ts`. |
| **VIZ-002** | CORS Origin Allowlist | **High** | Replaced wildcard `*.vercel.app`, `*.run.app`, and `*.google.com` trust rules in `src/server/security.ts` with exact HTTPS allowlisting (`https://vizra.vercel.app`, strictly scoped `vizra-*.vercel.app` previews, configured `APP_URL`, and exact preview hosts; loopback permitted only outside production). |
| **VIZ-003** | Rate Limiter & Lockout IP Spoofing | **High** | Introduced `getTrustedClientIp(req)` honoring Express `trust proxy` (`req.ip`) and replaced all manual leftmost `X-Forwarded-For` parsing across `security.ts`, `server.ts`, `observability.ts`, and `login-webhook.ts` so spoofed headers cannot bypass rate limits or lockouts. |
| **VIZ-004** | System Logs Cross-Tenant Disclosure | **High** | Excluded privileged admin, authentication, billing, account, token, and integration endpoints from the shared workspace `recentApiLogs` buffer in `src/server/observability.ts` so `/api/system-logs` never exposes administrative activity. |
| **VIZ-005** | Vulnerable Dependencies | **High** | Upgraded 5 vulnerable packages within semver ranges (`vite` 8.3.3, `body-parser` 1.20.9, `qs` 6.16.1, `re2js` 2.8.7, `source-map-js` 1.2.2), reducing advisories from 12 down to 2 transitive `@grpc/grpc-js` advisories pinned upstream by `@firebase/firestore`. |
| **VIZ-006** | Unsanitized Error Leakage | **High** | Wrapped raw `err.message` responses with `sanitizeServerError(...)` across `/api/science/query`, `/api/music/generate`, `/api/auth/login-notification`, `login-webhook.ts`, `engageRoutes.ts`, and `serverOmniaLearning.ts`. |
| **VIZ-007** | Webhook Raw-Body HMAC & Replay Bound | **High** | Captured raw request bytes (`req.rawBody`) in Express JSON parsing and switched `/api/billing/webhook` and `/api/compliance/age-assurance/parental-consent/callback` HMAC verification to authenticate raw wire bytes; bounded `processedBillingEventIds` to 5,000 entries. |
| **VIZ-008** | Structured Log IP Privacy | **Medium** | Applied `maskIpAddress(getTrustedClientIp(req))` in `src/server/observability.ts` so raw client IP addresses are never emitted in structured server logs. |
| **VIZ-009** | Cross-Site CSRF & API Resource Isolation | **Medium** | Added `Sec-Fetch-Site: cross-site` and untrusted `Referer` checks on state-changing `/api/*` routes (exempting signed webhooks/OAuth callbacks), plus `Cross-Origin-Resource-Policy: same-origin` on `/api/*` in both `security.ts` and `vercel.json`. |
| **VIZ-010** | Public Status Log Email Exposure | **Medium** | Redacted email addresses from public `recentLogs` in `/api/omnia/status` and stopped recording raw admin emails inside public moderation log messages. |
| **VIZ-011** | SSRF, Upstream Timeouts & Host Header Injection | **Medium** | Added `validateExternalUrlForSSRF()` + `redirect: 'error'` to `consentService.ts` webhooks, strict accession/path-traversal validation + 8s `AbortSignal.timeout` on `/api/science/query`, open-redirect guard on legacy aliases, and trusted-origin validation in `oauthManager.ts` `resolveCallbackUrl()`. |
| **VIZ-012** | Hardened Firestore Rules & Ops Runbooks (Pending Approval) | **High** | Drafted `DRAFT_firestore.rules` (enforcing `affectedKeys().hasOnly(...)`, ID binding on create, `https://` `photoURL` enforcement, token email binding, timestamp validation) and `security_spec.md`, plus `docs/OPERATIONS_BACKUP_DR_SCALABILITY.md` covering backups, monitoring, 9 disaster recovery playbooks, and Vercel Hobby limits. Production rules were intentionally not deployed without explicit approval. |

---

## PoC Verification

All security controls and local staging runtime characteristics were verified via automated scripts against the local server (`http://127.0.0.1:3000`) — zero tests targeted production (`https://vizra.vercel.app/`):

1. **Automated Security Verification (`scripts/securityAuditTests.ts`) — 12/12 PASSED**:
   - **SEC-01 & SEC-02 (Auth/JWT)**: Rejected `alg=none`, forged RS256 `kid`, expired, and wrong-audience tokens; verified strict fail-closed verification and `payload.email_verified === true`.
   - **SEC-03 (Access Control)**: Verified all 13 admin/private endpoints fail closed (`401`/`429`), confirming `AuthLockoutTracker` triggers `429` after repeated failed admin attempts.
   - **SEC-04 (CORS/CSRF)**: Verified `https://evil-attacker.vercel.app` and cross-site `Sec-Fetch-Site: cross-site` POSTs return `403`, while `https://vizra.vercel.app` succeeds (`200`).
   - **SEC-05 (IP Spoof Resistance & Masking)**: Verified spoofed leftmost `X-Forwarded-For` values resolve to the trusted proxy IP and still trip rate limits; verified IPv4 masking (`203.0.113.xxx`).
   - **SEC-06 (Billing & Quantity Integrity)**: Verified client plan upgrades and refills return `403`, invalid quantities (`0`, `-10`, `1.5`, `999999`) return `400`, and unconfigured/unsigned billing webhooks fail closed (`503`/`401`).
   - **SEC-07 (Tenant Isolation & Log Hygiene)**: Verified cross-tenant workspace token deletion returns `404`, `/api/system-logs` leaks zero admin/auth paths, and `/api/omnia/status` exposes zero email addresses.
   - **SEC-08 (SSRF & Path Injection)**: Blocked 6/6 metadata/loopback/`file://` SSRF targets and rejected `../../etc/passwd` in `/api/science/query` (`400`).
   - **SEC-09 (XSS, Prompt Injection & File Uploads)**: Blocked `javascript:`/`data:`/`vbscript:` URLs, flagged prompt-injection attempts, rejected disguised SVG/EXE uploads as PNG, and accepted valid PNG magic bytes.
   - **SEC-10 (Sensitive Files & Security Headers)**: Verified `/.env`, `/.git/config`, `/server.ts`, `/data/credit_ledger_store.json`, `/*.map`, and `/backup.sql` all return `404`; verified CSP, HSTS, `nosniff`, CORP `same-origin`, `X-Robots-Tag`, and absence of `X-Powered-By`.
   - **SEC-11 (AES-256-GCM OAuth Vault)**: Verified encryption round-trip succeeds and tampered ciphertext fails GCM authentication (`null`).
   - **SEC-12 (Draft Firestore Rules Invariants)**: Verified default-deny, disabled user listing, immutable messages, `affectedKeys` update guards, `https://` `photoURL` constraint, token email binding, and create-time ID binding.
2. **Controlled Local Staging Benchmark (`scripts/stagingLoadBenchmark.ts`)**:
   - Executed gradual ramp (`10 -> 25 -> 50` concurrent workers) against local non-AI endpoints only (`/api/health`, `/api/omnia/status`) with zero production or external AI quota impact.
   - Achieved **419.9–673.2 RPS** with **0 server errors (`0` 5xx)**, **p50 12.3–70.6 ms**, and **p95 60.8–127.1 ms**; confirmed `publicApiRateLimiter` cleanly enforced `429` beyond per-IP budget without instability.
3. **Build & Static Type Verification**:
   - Verified with `tsc --noEmit` (`lint_applet`), full production build + static route prerender (`compile_applet`), and post-fix `bun audit` (reduced from 12 advisories to 2 upstream-pinned transitive advisories).
