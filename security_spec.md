# VIZRA Firestore Security Specification & Red-Team TDD Matrix

## Phase 0: Data Invariants & Trust Boundaries

1. **Identity & Ownership**:
   - Firebase Authentication UID (`request.auth.uid`) is the sole trusted client identity.
   - Client applications CANNOT self-assert `ageStatus`, `consentStatus`, `accountAccessState`, `role`, or `isAdmin` inside Firestore documents.
2. **Collection Invariants**:
   - `/users/{userId}`: Strict owner-only `get`, `create`, `update`, `delete`. `list` is universally `false`. Strict `hasOnly(['uid', 'email', 'displayName', 'photoURL', 'createdAt', 'lastLoginAt'])` prevents injecting spoofed age/consent/role fields. `uid` and `createdAt` are immutable.
   - `/users/{userId}/projects/{projectId}`: Strict owner-only CRUD. `id == projectId`, `ownerId == userId`, `createdAt` immutable.
   - `/users/{userId}/conversations/{conversationId}/messages/{messageId}`: Strict owner-only `get`, `list`, `create`, `delete`. `update` is universally `false` (immutable history). **Minor Data Protection Invariant**: Parents/guardians do NOT have Firestore read access to a child's conversations or messages.
   - `/parental_consents/{consentId}`: **Server-authoritative only.** `allow create, update, delete: if false;` prevents any client (minor, parent, or attacker) from forging, modifying, self-approving, or erasing parental consent records. `allow get, list:` strictly scoped to the two named parties (`request.auth.uid == resource.data.child_uid || request.auth.uid == resource.data.parent_uid`).
   - `/parent_child_relationships/{relationshipId}`: **Server-authoritative only.** `allow create, update, delete: if false;`. `allow get, list:` strictly scoped to the linked parties (`request.auth.uid == resource.data.child_uid || request.auth.uid == resource.data.parent_uid`).
   - `/consent_audit_logs/{eventId}`: **Strictly server-only.** `allow read, write: if false;`. Zero client read, list, create, update, or delete access.
   - `/test/{docId}`: Diagnostic `get` strictly scoped to `docId == 'connection'`.
   - Default catch-all `/{document=**}`: `allow read, write: if false;`.

---

## Dirty Dozen Red-Team Attack Matrix (All Must Be DENIED)

| # | Attack Vector | Target Path | Actor | Payload / Operation | Expected Result | Rule Enforcement |
|---|---|---|---|---|---|---|
| 1 | Self-approve parental consent from client SDK | `/parental_consents/pc_forged` | Minor (`uid: child_1`) | `create` `{ child_uid: 'child_1', parent_uid: 'child_1', consent_status: 'VERIFIED' }` | **DENY** | `allow create: if false;` |
| 2 | Parent directly flips `PENDING_VERIFICATION` to `VERIFIED` via client SDK | `/parental_consents/pc_123` | Parent (`uid: parent_1`) | `update` `{ consent_status: 'VERIFIED' }` | **DENY** | `allow update: if false;` |
| 3 | Client deletes consent record to erase compliance history | `/parental_consents/pc_123` | Minor or Parent | `delete` | **DENY** | `allow delete: if false;` |
| 4 | Unrelated authenticated user reads another family's consent doc | `/parental_consents/pc_123` | Stranger (`uid: stranger_9`) | `get` | **DENY** | `isConsentParty(existing())` fails |
| 5 | Unrelated user runs unscoped collection query on `parental_consents` | `/parental_consents` | Stranger (`uid: stranger_9`) | `list` (no `where` filter matching `uid`) | **DENY** | `allow list` requires rule-provable `resource.data.child_uid == uid \|\| resource.data.parent_uid == uid` |
| 6 | Client forges a parent-child relationship link | `/parent_child_relationships/rel_forged` | Attacker (`uid: attacker_1`) | `create` `{ parent_uid: 'attacker_1', child_uid: 'child_1', relationship_status: 'ACTIVE' }` | **DENY** | `allow create: if false;` |
| 7 | Client tampers with or reads `consent_audit_logs` | `/consent_audit_logs/evt_1` | Any authenticated client | `get`, `list`, `create`, `update`, `delete` | **DENY** | `allow read, write: if false;` |
| 8 | Parent tries to read minor's private Omnia conversations directly | `/users/child_1/conversations/c1/messages/m1` | Parent (`uid: parent_1`) | `get` or `list` | **DENY** | `isOwner('child_1')` requires `request.auth.uid == 'child_1'` |
| 9 | Shadow field privilege escalation on `/users/{uid}` | `/users/child_1` | Minor (`uid: child_1`) | `update` `{ ..., ageStatus: 'ADULT_DECLARED', accountAccessState: 'ADULT_ACCESS', role: 'admin' }` | **DENY** | `isValidUserProfile` enforces `hasOnly([...])` |
| 10 | Immutable field tampering (`createdAt` / `uid` hijack) | `/users/child_1` | Minor (`uid: child_1`) | `update` `{ uid: 'adult_1', createdAt: '2020-01-01T00:00:00Z' }` | **DENY** | `incoming().uid == userId && incoming().createdAt == existing().createdAt` |
| 11 | Global user enumeration | `/users` | Any authenticated user | `list` | **DENY** | `allow list: if false;` |
| 12 | Malformed / path-injection document ID | `/users/child_1/projects/../../admin` | Any authenticated user | `create` / `get` | **DENY** | `isValidId(projectId)` regex `^[a-zA-Z0-9_\-]+$` |
