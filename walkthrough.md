# Security Summary

During the security audit and architecture upgrade for the **VIZRA Age Assurance, Parental Consent & NO POWERS Framework**, we identified and fixed six concrete security gaps across server authorization, real-time WebSocket upgrades, billing webhooks, data erasure, and Firestore access control:

1. **Missing Age-Assurance Enforcement on Local RAG Embedding Routes** (`server.ts`):
   - *Risk*: Unverified minors or accounts with revoked parental consent were blocked from `/api/chat` but could still invoke `/api/rag/embed` and `/api/rag/embed/batch`, bypassing minor access restrictions and consuming upstream embedding compute.
   - *Fix*: Added `enforceFeatureAccessForRequest(req, 'rag_local_restricted')` at the top of both `/api/rag/embed` and `/api/rag/embed/batch`, returning `403` whenever an account is blocked or consent is pending/revoked.

2. **WebSocket Live Voice Time-of-Check to Time-of-Use (TOCTOU) Gap** (`server.ts`):
   - *Risk*: `POST /api/live/session` checked age eligibility when issuing a 60-second single-use ticket, but the `/live` WebSocket `upgrade` handler did not re-check the account's live access state before upgrading the socket. If parental consent was revoked or an account was flagged in between, the WebSocket upgrade could still succeed.
   - *Fix*: Added `enforceFeatureAccessForUid(ticketRecord.uid, 'voice_live')` inside the `server.on('upgrade')` handler, returning `HTTP/1.1 403 Forbidden` and destroying the socket immediately if ineligible.

3. **Minor / Omnia Youth Paid Upgrade Bypass on Billing Webhook** (`server.ts`):
   - *Risk*: `POST /api/billing/webhook` validated the HMAC-SHA256 signature and plan amount, but did not verify that the target user account was eligible for paid upgrades (`OMNIA_ADULT`), allowing a webhook event to upgrade an Omnia Youth account.
   - *Fix*: Added `enforceFeatureAccessForUid(uid, 'paid_billing')` prior to mutating the tenant credit ledger, rejecting minor/youth upgrade events with `403`.

4. **Omnia Youth File Analysis & Prompt Boundary Enforcement** (`server.ts`, `src/server/compliance/ageAssurance.ts`):
   - *Risk*: Minor accounts with verified parental consent shared the same 50,000-character prompt cap and 5-file / 10MB / audio-enabled attachment limits as adults.
   - *Fix*: Enforced server-side `validateYouthAttachmentRestrictions()` and `resourceLimits.maxPromptChars` in `POST /api/chat`, capping Omnia Youth accounts to 25,000 characters, max 2 attachments, ≤5MB per file, and blocking raw audio uploads.

5. **Double-Hashing Bug in Anonymous Account Data Erasure** (`server.ts`):
   - *Risk*: `DELETE /api/account/data` hashed the `X-Vizra-Client-Id` header before passing it into `purgeAgeAssuranceRecordsForSubjects()`, which hashed the seed a second time. As a result, anonymous age-assurance records were not matched or deleted during user-initiated erasure.
   - *Fix*: Separated `ageSeedsToPurge` (passing the raw `client:<id>` seed expected by `ageAssurance.ts` plus the legacy double-hashed form for backward compatibility) from `workspaceTenantKeysToPurge`, ensuring complete erasure of age-assurance, parental consent, and workspace token records.

6. **Client-Side Consent Tampering, Shadow Field Injection & Child Conversation Privacy** (`firestore.rules`, `firebase-blueprint.json`):
   - *Risk*: Without explicit server-write-only rules for parental consent collections, malicious clients could attempt to self-approve parental consent, forge parent-child links, modify audit logs, inject spoofed `ageStatus`/`consentStatus` fields into `/users/{uid}`, or inspect child conversations from a parent account.
   - *Fix*: Hardened and deployed `firestore.rules` with `allow create, update, delete: if false;` on `/parental_consents/{consentId}` and `/parent_child_relationships/{relationshipId}` (party-scoped `get`/`list` only), `allow read, write: if false;` on `/consent_audit_logs/{eventId}`, strict `hasOnly([...])` schema allowlisting on `/users/{userId}`, and strict owner-only access on `/users/{userId}/conversations/{conversationId}/messages/{messageId}` so child conversations are never exposed to parents.

### Additional Audited Controls Confirmed Intact
- **Resource & Abuse Boundaries**: Verified 50,000-char Adult / 25,000-char Youth prompt limit, 5-file Adult / 2-file Youth attachment limits, 10MB decoded / 15MB JSON body cap, 25MB local RAG cap, and sliding-window rate limiters across all API tiers.
- **SSRF & Injection Protection**: Verified DNS-resolved SSRF blocking for loopback (`127.0.0.1`, `::1`), RFC1918 private ranges, and cloud metadata (`169.254.169.254`), plus boundary-nonce isolation and prompt injection filtering.
- **Dependency Audit Note**: Running `bun audit` surfaced two transitive advisories in `@grpc/grpc-js@1.9.16` (pulled transitively via `firebase > @firebase/firestore-compat > @firebase/firestore`). Because VIZRA does not run a gRPC server in browser bundles and upgrading transitive Firebase internals risks breaking Firestore compatibility, this is documented as an upstream dependency monitor item rather than forced via an unsafe override.

---

## PoC Verification

All fixes above were verified with real executable checks in `scripts/testAgeAssuranceAndSecurity.ts` (`npm run test:security`), which boots the live Express application on an ephemeral loopback port using synthetic test identities and cleans up all test state afterward:

1. **RAG Embedding Minor Bypass (Blocked — Test #14)**:
   - *Test*: Registered a synthetic India minor session (`declaredAge: 14`, `jurisdiction: 'IN'`) via `POST /api/compliance/age-assurance/evaluate`, then sent `POST /api/rag/embed` and `POST /api/rag/embed/batch` with the same `X-Vizra-Client-Id`.
   - *Observed Result*: Both endpoints returned `HTTP 403` instead of forwarding to the embedding handler.

2. **Billing Webhook Upgrade for Omnia Youth (Blocked — Test #12)**:
   - *Test*: Activated a synthetic Omnia Youth UID via full invitation → parent approval → HMAC-SHA256 signed verification webhook, then submitted a validly signed `POST /api/billing/webhook` attempting to upgrade that Youth UID to the `pro` plan.
   - *Observed Result*: Returned `HTTP 403` (`MINOR_PAID_BILLING_FORBIDDEN`); credit ledger remained unchanged.

3. **Self-Approval & Client State Spoofing (Blocked — Test #7)**:
   - *Test*: Attempted `recordParentApproval` where `parentUid === childUid` and sent `POST /api/compliance/age-assurance/evaluate` with spoofed `accountAccessState: 'ADULT_ACCESS'` and `consentStatus: 'VERIFIED'` fields.
   - *Observed Result*: Self-approval rejected with `SELF_CONSENT_FORBIDDEN`; spoofed evaluate payload rejected with `HTTP 403` (`SPOOFED_ACCESS_STATE_REJECTED`).

4. **Fail-Closed Verification & Immediate Revocation (Verified — Tests #6, #10, #11, #13)**:
   - *Test*: Confirmed `enforceFeatureAccessForUid(childUid, 'chat_basic')` returned `allowed: false` while status was `PENDING_VERIFICATION`; switched to `allowed: true` (`OMNIA_YOUTH`) only after a validly signed HMAC-SHA256 verification callback; confirmed `voice_live`, `music_generation`, `paid_billing`, `third_party_workspace_oauth`, and `engage_commercial` remained `403`; confirmed 3 attachments, >5MB files, and audio uploads were blocked for Youth; confirmed `revokeParentalConsent` immediately reverted `chat_basic` and `rag_local_restricted` to `403`.

5. **Anonymous Erasure Double-Hash Fix (Verified — Test #15)**:
   - *Test*: Evaluated age for a synthetic `X-Vizra-Client-Id`, then called `DELETE /api/account/data` with that header.
   - *Observed Result*: Returned `HTTP 200` with `purgedAgeAssuranceCount >= 1` and `age_assurance_and_parental_consent_records` included in `purgedStores`.

6. **Firestore Security Rules & Live Deployment (Verified — Test #18 + Firebase Deploy)**:
   - *Test*: Deployed `/firestore.rules` cleanly via Firebase `DeployRules` (passing Firebase's live rules compiler) and verified all structural invariants in Test #18 (default deny, zero blanket signed-in reads, server-write-only parental consent & relationship collections, zero client access to `consent_audit_logs`, strict `hasOnly` shadow-field prevention on `/users/{userId}`, and strict owner-only child conversation isolation).
