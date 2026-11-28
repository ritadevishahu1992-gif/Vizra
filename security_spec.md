# VIZRA AI Creative Studio — Firebase Security Specification

## 1. Firebase Architecture & Access Control Matrix

- **Project ID**: `nice-dolphin-n7c1c`
- **Firestore Database ID**: `ai-studio-vizraaicreatives-526756ea-8369-4e64-bb74-541d358e399a`
- **Realtime Database**: Configured for `/studio_presence/$roomId/$sessionId` (`database.rules.json`)
- **Firebase Storage**: Configured in `firebase-applet-config.json` (`nice-dolphin-n7c1c.firebasestorage.app`), **unused in application code** (recommend deploying default-deny `storage.rules` if Storage is activated in Firebase Console).
- **Firebase App Check**: **Not yet enabled** (`recaptchaSiteKey: ""`).

| Collection / Path | Get | List | Create | Update | Delete |
| --- | --- | --- | --- | --- | --- |
| `/{document=**}` | DENY | DENY | DENY | DENY | DENY |
| `/users/{userId}` | Owner only | **DENY** (no enumeration) | Owner + strict schema | Owner + `affectedKeys().hasOnly(['email','displayName','photoURL','lastLoginAt'])` + immutable `uid`/`createdAt` | Owner only |
| `/users/{userId}/projects/{projectId}` | Owner only | Owner only | Owner + strict schema + `id == projectId` | Owner + `affectedKeys().hasOnly(['title','category','description','status','stages','updatedAt'])` + immutable `id`/`ownerId`/`createdAt` | Owner only |
| `/users/{userId}/conversations/{convId}/messages/{msgId}` | Owner only | Owner only | Owner + strict schema + `id == msgId` + `conversationId == convId` | **DENY** (immutable history) | Owner only |
| `/test/connection` | Read-only diagnostic sentinel | DENY | DENY | DENY | DENY |
| RTDB `/studio_presence/$roomId/$sessionId` | Signed-in user (room-scoped) | Signed-in user | Own `uid === auth.uid` + strict coordinate/type bounds | Own `uid === auth.uid` | Own `uid === auth.uid` |

---

## 2. Core Data Invariants

1. **Zero Privilege/Billing Shadow Fields in Firestore**: Client writes to `/users/{userId}` are strictly restricted to `['uid', 'email', 'displayName', 'photoURL', 'createdAt', 'lastLoginAt']`. Any attempt to inject `role`, `isAdmin`, `plan`, `planId`, `subscription`, or `credits` is denied.
2. **Ownership Binding**: Every document under `/users/{userId}` enforces `request.auth.uid == userId` AND matches the internal ownership field (`uid`, `ownerId`, or `userId`).
3. **Immutable Audit & Identity Fields**: `uid`, `ownerId`, `id`, and `createdAt` cannot be modified after creation. Chat messages are append-only (`allow update: if false`).
4. **URI & Size Safety**: `photoURL` must be `null`, empty, or `https://...` (no `javascript:` or `data:` URIs); `content` is bounded to `1..20000` chars; `stages` <= 25 items; `sources` <= 50 items.
5. **Email Integrity**: If `request.auth.token.email` is present, a user's Firestore profile `email` must match their authenticated Firebase token email (preventing email impersonation).

---

## 3. Adversarial Test Payloads ("Dirty Dozen")

Every payload below MUST be **DENIED** by `DRAFT_firestore.rules`:

1. **Unauthenticated Profile Read**: `GET /users/user_a` with `auth == null` -> **DENY**.
2. **User Directory Enumeration**: `LIST /users` as authenticated `user_a` -> **DENY** (`allow list: if false`).
3. **Cross-User Profile Read (IDOR)**: `GET /users/user_b` as authenticated `user_a` -> **DENY**.
4. **Cross-User Project Creation**: `CREATE /users/user_b/projects/p1` as `user_a` -> **DENY**.
5. **Privilege Escalation (Mass Assignment)**: `UPDATE /users/user_a` adding `{ isAdmin: true, role: "admin" }` -> **DENY** (`hasOnly` & `affectedKeys` fail).
6. **Subscription/Credits Tampering**: `UPDATE /users/user_a` adding `{ planId: "studio", credits: 999999 }` -> **DENY**.
7. **Immutable Identity Hijack**: `UPDATE /users/user_a/projects/p1` changing `ownerId: "user_b"` or `createdAt: "1999-01-01T00:00:00Z"` -> **DENY**.
8. **Document ID / Foreign Key Mismatch**: `CREATE /users/user_a/projects/proj_1` with `{ id: "proj_other", ... }` -> **DENY**.
9. **Stored XSS via Profile Photo URI**: `UPDATE /users/user_a` with `{ photoURL: "javascript:alert(1)" }` -> **DENY** (`^https://.*` regex fails).
10. **Chat History Tampering**: `UPDATE /users/user_a/conversations/c1/messages/m1` modifying `content` -> **DENY** (`allow update: if false`).
11. **Oversized Storage Exhaustion**: `CREATE /users/user_a/conversations/c1/messages/m2` with `content.size() == 25000` -> **DENY** (`<= 20000`).
12. **Path/ID Poisoning & Arbitrary Collection Write**: `CREATE /admin_config/global` or `CREATE /users/user_a/projects/bad..id` -> **DENY** (default-deny + `isValidId`).
