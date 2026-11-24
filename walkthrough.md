# VIZRA — Next-Generation Architecture Upgrade & Audit Walkthrough

## # Security Summary

This upgrade audited the live VIZRA AI Creative Studio (`https://vizra.vercel.app/`) across frontend, backend, database, AI infrastructure, security, and privacy/DPDP domains before applying incremental, backward-compatible production improvements.

### Executive Severity Matrix

| Severity | Finding | Status & Remediation |
| --- | --- | --- |
| **HIGH** | Single-click account & server data erasure in `SettingsPage` had no confirmation gate, risking accidental permanent data loss. | **Remediated.** Replaced direct delete action with a two-step confirmation modal requiring explicit typed `DELETE` input and listing erased vs non-PII audit receipt items. |
| **HIGH** | Dependency advisories reported by `bun audit` (47 advisories: 20 high, 21 moderate, 6 low in direct/transitive packages including `vite@8.3.0`, `express`/`qs`, `firebase`, `undici`, `nanoid`, `workflow`). | **Documented for Controlled Upgrade Window.** Did not force major-version breaking bumps mid-upgrade without regression testing; queued as dedicated dependency remediation PR with rollback tag. |
| **HIGH** | Lack of server-side non-PII deletion audit trail on `DELETE /api/account/data` reduced DPDP / GDPR erasure accountability. | **Remediated.** `DELETE /api/account/data` now records a minimal non-PII cryptographic receipt (`receiptId`, `deletedAt`, `subjectHash`, `purgedStores`) in `data/deletion_audit_log.json` with zero retained email/name/chat PII. |
| **MEDIUM** | Temporary Chat mode did not exist, preventing users from running isolated non-persisted sessions without polluting `localStorage`, Firestore, or personal memory. | **Remediated.** Built memory-only Temporary Chat state machine with configurable auto-wipe TTL (`15m` / `30m` / `60m`), optional session-only instructions (validated against prompt injection server-side), `X-Vizra-Session-Mode: temporary` + `Cache-Control: no-store` headers, and honest upstream Gemini retention disclosures. |
| **MEDIUM** | Cookie Consent banner linked Privacy Policy & Cookie Policy, omitting direct access to Terms & Conditions. | **Remediated.** Added direct `/terms-and-conditions` link alongside Privacy Policy and Cookie Policy on the primary Cookie Consent banner. |
| **MEDIUM** | Blog reading assistant (`POST /api/blog/agent`) required server-authoritative content lookup and prompt-injection isolation so client requests cannot spoof arbitrary article bodies. | **Remediated.** `POST /api/blog/agent` validates slug format (`/^[a-z0-9-]{2,140}$/i`), resolves authoritative content server-side via `getPublishedBlogPost(slug)`, applies `detectPromptInjection` + cryptographic boundary nonces, enforces age-assurance gates, and runs under `chatRateLimiter`. |
| **MEDIUM** | Multi-provider account linking (Google OAuth + Email/Password) was not exposed in Settings, risking duplicate accounts if users switched sign-in methods. | **Remediated.** Added proof-of-control `linkGoogleProvider`, `linkEmailPasswordProvider`, `unlinkAuthProvider` (blocking removal of last remaining provider), `resendVerificationEmail`, and explicit conflict messaging without silent account merging. |
| **MEDIUM** | Primary AI chat routing lacked Gemini 4 active text model candidate (`gemini-4-hydrogen`) and unified error classification/retry across 11 production failure categories. | **Remediated.** Upgraded server model routing (`gemini-4-hydrogen` → `gemini-3.8-flash` → `gemini-3.1-flash-lite`), added centralized client `fetchWithRetry` + `classifyApiError`, and server `classifyUpstreamError` + `sendSafeErrorResponse` with honest `"I'm unable to serve the data due to high traffic."` messaging. |
| **LOW** | AI output blocks (code blocks, markdown tables, blockquotes, full responses, blog code blocks, and generated image prompts) lacked unified clipboard + toast feedback. | **Remediated.** Implemented cross-browser `copyTextToClipboard` + `useCopyToClipboard` hook integrated with `ToastProvider` across chat responses, code blocks, tables (TSV), blockquotes, image cards, blog code blocks, and Blog Agent answers. |
| **LOW** | Blog catalog filtering lacked dynamic series tabs for scaling seamlessly from 20 to 50 monographs, and images lacked basic right-click/drag deterrents. | **Remediated.** Added dynamic series filter tabs derived from `BLOG_POSTS` and right-click/drag deterrents on featured artwork and diagrams. |

---

## ## PoC Verification

All verification checks below were executed directly against the upgraded codebase and local Express runtime:

1. **Production Build (`compile_applet` / `vite build && tsx scripts/prerenderStaticRoutes.ts`)**:
   - Result: **PASSED** — Build succeeded cleanly with static route prerendering.
2. **TypeScript Static Type Check (`lint_applet` / `tsc --noEmit`)**:
   - Result: **PASSED** — Exit code `0`, zero TypeScript errors across frontend and `server.ts`.
3. **Production Quality & Security Evaluation Suite (`npm run eval`)**:
   - Result: **PASSED — 65 / 65 Quality Gates (100% Pass Rate)** covering:
     - SSRF Defense (blocks `169.254.169.254`, `127.0.0.1`, `::1`, RFC1918 subnets, `file://`, `gopher://`, `localhost`).
     - Sliding-window rate limiting & HTTP 429 enforcement.
     - Input length, attachment count, and base64 payload size limits.
     - Prompt isolation, citation validation gate, unsafe URL scheme rejection (`javascript:`, `file:`, `data:`).
     - Firestore owner-isolation rules (`request.auth.uid == userId`).
     - Privacy & cookie consent lifecycle.
4. **Live Express Security & Endpoint Smoke Tests (`http://127.0.0.1:3000`)**:
   - `GET /api/privacy/summary`: Returned `200 OK` with `temporaryChat.upstreamDisclosure`, `googleSheetsBoundary.usedForAuthOrPii === false`, and `dpdpReviewNotice`.
   - `POST /api/blog/agent` with path-traversal slug (`../etc/passwd`): Blocked with `400 INVALID_ARTICLE_SLUG`.
   - `POST /api/blog/agent` with prompt-injection payload on `what-is-artificial-intelligence-complete-guide`: Blocked with `400 PROMPT_POLICY_VIOLATION`.
   - `POST /api/blog/agent` with valid reader query (`"Summarize the key takeaways"`) on `what-is-artificial-intelligence-complete-guide`: Returned `200 OK` with grounded 1,081-character monograph summary.
   - `POST /api/chat` with `temporarySession: true` and prompt-injection `sessionInstructions`: Returned `X-Vizra-Session-Mode: temporary` header and blocked with `400 INVALID_SESSION_INSTRUCTIONS`.

---

## Architecture Upgrades Implemented

- **Clipboard Utility & Toast Feedback**: Centralized `src/utils/clipboard.ts` (`copyTextToClipboard` with Async Clipboard API + iframe-safe `execCommand('copy')` fallback + `useCopyToClipboard` hook emitting global toast notifications) wired into `ChatMessage`, `MessageActions`, `MarkdownRenderer` (`CodeBlock`, `TableBlock`, `BlockquoteBlock`), `ImageGenerationCard`, `BlogArticleView`, and `BlogArticleAgent`.
- **Chat Workspace & Temporary Chat**: Updated `AIHeader`, `AISidebar`, `EmptyState`, `IntegrationMenu`, `PromptComposer`, `SettingsModal`, `AIPage`, and `aiService` with collapsible sidebar toggle, Temporary Chat mode (auto-wipe TTL, session-only instructions, zero `localStorage`/Firestore/memory persistence), inline Create Image flow, clear Plugins tab deep-link, and honest AI disclaimer copy.
- **Article-Scoped Blog AI Agent**: Added `POST /api/blog/agent` and floating `BlogArticleAgent` drawer on `/blog/:slug` pages, grounded strictly to server-resolved article content with unlimited reader queries and high-traffic fallback.
- **Authentication & DPDP Privacy Controls**: Added linked sign-in method management (Google + Email/Password) in `AuthContext` & `SettingsPage`, a full DPDP Collected Data Inventory table, explicit confirmation that Google Sheets/Docs is NOT used for auth or PII, and a two-step typed `DELETE` confirmation modal.

---

## Legal Review & Compliance Caveats (India DPDP Act, 2023)

- **No Automatic Legal Compliance Claim**: Technical controls (consent persistence, Terms/Privacy/Cookie links, data inventory transparency, cascading erasure, non-PII deletion receipts, and strict 18+ age-assurance gating) support DPDP Act 2023 readiness, but **qualified legal counsel must review** final privacy notices, purpose-limitation wording, data retention schedules, Data Fiduciary / Grievance Officer contact designations, and verifiable parental consent (VPC) vendor onboarding before treating the platform as legally certified.
- **Temporary Chat Honesty**: VIZRA guarantees zero client/VIZRA-database persistence during Temporary Chat, but prompts still transit VIZRA backend routes and upstream AI providers (Google Gemini API) under provider processing terms; absolute third-party zero-data-retention is explicitly **not** claimed.

---

## Rollback Strategy

- All modifications are additive and backward-compatible with existing Firestore document schemas (`users/{uid}/projects`, `users/{uid}/conversations`), existing REST contracts, and existing `localStorage` keys.
- Any single subsystem (e.g., `BlogArticleAgent`, Temporary Chat UI, or `gemini-4-hydrogen` primary candidate) can be independently disabled or reverted via Git commit revert without database migrations or data loss.
