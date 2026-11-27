# VIZRA — Application Security Audit & Hardening Walkthrough

# Security Summary

A full 14-point application-security audit was performed across the VIZRA frontend, Express backend (`server.ts`), Engage routes/store, OAuth integration manager, Vite build/dev config, and Firestore security rules under the threat model of an attacker with complete control over browser requests and client state.

## Executive Severity Matrix

| # | Audit Area | Initial Status | Severity | Fix Applied |
| --- | --- | --- | --- | --- |
| 1 | Admin routes | FAIL | **High** | Closed the non-production auto-admin bypass in `engageAdminAuthMiddleware`, enforced verified email claims on admin tokens, and filtered `GET /api/omnia/knowledge` to approved public entries only. |
| 2 | IDOR | FAIL | **High** | Raised anonymous `X-Vizra-Client-Id` minimum length to 16+ high-entropy characters, HMAC-bound anonymous tenant keys server-side, and strictly pinned authenticated `DELETE /api/account/data` to `uid:<verifiedUid>` (ignoring arbitrary client headers). |
| 3 | Secrets in the client | PASS | **Low** | Verified zero server secrets (`GEMINI_API_KEY`, `ADMIN_API_KEY`, `OAUTH_*_SECRET`, DB credentials) are bundled or prefixed with `VITE_`. |
| 4 | Price tampering | FAIL | **Critical** | Added authoritative server-side `PLAN_CREDIT_CATALOG` pricing (`monthlyPriceUsd`, `yearlyPriceUsd`, credit limits) and stopped honoring client-supplied `?plan=` or `planId` mutations. |
| 5 | Quantity tampering | FAIL | **Medium** | Replaced silent clamping with strict integer validation (`1..50` on `/api/credits/usage`, `1..20` on Engage `/select`), returning `400 INVALID_QUANTITY` for `0`, negative, decimal, or oversized values. |
| 6 | Fake payment | FAIL | **Critical** | Removed client-triggered credit refills and self-service plan upgrades (`403 PAYMENT_VERIFICATION_REQUIRED` unless verified admin) and added HMAC-SHA256 signature-verified, replay-protected `POST /api/billing/webhook`. |
| 7 | Coupon abuse | NOT APPLICABLE | **Low** | No coupon or promo redemption endpoint exists (only a static annual billing toggle). Provided a server-side atomic single-use transaction pattern for future adoption. |
| 8 | Mass assignment | FAIL | **Critical** | Blocked client `planId`/credit tampering, replaced `{ ...article }` spread in `/api/blog/knowledge/sync` with explicit field allowlisting, and replaced `...patch`/`...item` spreads in `engageStore.ts` with strict mutable-field whitelists. |
| 9 | OTP / login brute force | FAIL | **Medium** | Added `AuthLockoutTracker` (5 consecutive failed admin auth attempts trigger a 15-minute IP lockout), extended `authBruteForceRateLimiter` across all admin/metrics/training routes, and surfaced Firebase `auth/too-many-requests` lockout guidance in `AuthContext`. |
| 10 | Prompt injection | FAIL | **High** | Moved user-supplied `cleanSessionInstructions` out of privileged `systemInstruction` into a nonce-isolated `<untrusted_data>` user block, blocked HTTP redirects (`redirect: 'error'`) on remote image fetches to prevent redirect-based metadata access, and banned `image/svg+xml`. |
| 11 | XSS | FAIL | **High** | Fixed reflected XSS in OAuth callback error handling (`text/plain` + character stripping), enforced explicit `trust: false` on KaTeX rendering call sites, and added `toSafeExternalHref()` (`http:`/`https:` allowlist) to dynamic external links. |
| 12 | File upload | FAIL | **Medium** | Replaced extension denylists with strict MIME/extension allowlists, a 10 MB aggregate decoded payload cap, and binary magic-byte header verification across chat attachments and `/api/music/generate` cover images (processed in memory, outside web root, never executed). |
| 13 | Exposed files | FAIL | **High** | Added Express middleware returning `404` for dotfiles (`.env`, `.git`, `.backups`), `/data/`, `/server.ts`, `/src/server/`, `/scripts/`, and `.map`/`.bak`/`.sql`/`.key` paths; enforced `dotfiles: 'deny'` on static serving, `build.sourcemap: false` and `server.fs.deny` in Vite; gated `/api/config/status` behind admin auth and stripped internal memory/env fields from `/api/health`. |
| 14 | Injection | PASS | **Low** | Confirmed typed Firestore SDK access with zero raw SQL or string-built queries and default-deny owner-isolated Firestore rules (`isOwner(userId)`). |

## Dependency Security Advisory Summary

- Ran a read-only dependency check (`bun audit`): reported **47 advisories (20 high, 21 moderate, 6 low)** across direct and transitive dependencies (`vite`, `body-parser`/`qs`, `re2js`, `source-map-js`, `devalue`, `nanoid`, `undici`, `zod`, `minimatch`).
- To preserve build stability during this security hardening pass, major-version dependency upgrades were not forced automatically; schedule a dedicated dependency upgrade window with full regression testing and rollback protection.

---

## PoC Verification

All remediated controls were verified through static type checking (`tsc --noEmit`), production bundle compilation (`vite build` + static prerendering), and review of request-handling boundaries:

1. **Billing, Credits & Quantity Enforcement**:
   - Requests attempting to supply `planId` or `action: "refill"` without verified admin credentials receive `403 PAYMENT_VERIFICATION_REQUIRED`.
   - Requests supplying `amount: 0`, `-5`, `1.5`, or `999999` on `/api/credits/usage` (or invalid `limit` on Engage selection) are rejected with `400 INVALID_QUANTITY`.
   - Plan upgrades and credit grants are processed solely via `POST /api/billing/webhook` after timing-safe HMAC-SHA256 verification against `PAYMENT_WEBHOOK_SECRET`, replay-ID deduplication, and server-side price lookup from `PLAN_CREDIT_CATALOG`.
2. **Admin & IDOR Isolation**:
   - `engageAdminAuthMiddleware` fails closed with `401` across all environments when no verified admin credential is presented, and locks out IPs via `authLockoutTracker` after 5 consecutive failures.
   - `GET /api/omnia/knowledge` returns only entries where `accessLevel === 'public'` and `status === 'APPROVED'`.
   - Anonymous tenant keys require 16+ character IDs bound via server-side HMAC; authenticated `DELETE /api/account/data` strictly scopes erasure to the verified Firebase UID and ignores untrusted client ID headers.
3. **File Exposure, Upload Validation & XSS / Prompt Isolation**:
   - Direct requests for `/.env`, `/.git/config`, `/.backups/*`, `/data/*`, `/server.ts`, or `*.map` are intercepted early and returned as `404 Not Found`; `vite.config.ts` enforces `build.sourcemap: false` and `server.fs.deny`.
   - Binary uploads and cover images are checked against an explicit MIME/extension allowlist and magic-byte signatures, rejecting disguised HTML/SVG/script files.
   - OAuth error callbacks return `text/plain; charset=utf-8` with control/tag characters stripped, dynamic external links pass through `toSafeExternalHref()`, and `cleanSessionInstructions` are isolated in a nonce-delimited untrusted data block rather than `systemInstruction`.
4. **Build & Type Verification**:
   - Verified with `compile_applet` (Vite build + static prerender) and `lint_applet` (`tsc --noEmit`), followed by dev server restart to activate all backend hardening rules.
