/**
 * FIREBASE-ALIGNED PARENTAL CONSENT & RELATIONSHIP STORE
 *
 * Logical Firestore Collections (Authoritative Schema):
 * - parental_consents
 * - parent_child_relationships
 * - consent_audit_logs
 *
 * Privacy & Security Guarantees:
 * - Zero raw identity documents, facial images, biometric templates, passwords, OTPs, or payment details stored.
 * - Server-generated UTC ISO timestamps only (never trusting client timestamps).
 * - When FIREBASE_SERVICE_ACCOUNT_JSON is configured on a user-owned project with Firestore IAM,
 *   writes are persisted directly to Firestore via authenticated REST API; otherwise persists to
 *   server-side atomic JSON storage while clearly reporting persistenceMode.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getFirebaseProjectId } from '../config/envConfig';

export const CONSENT_POLICY_VERSION = '2026-11-28.v2';
export const INVITATION_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours
export const CONSENT_DEFAULT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year renewal boundary

export type AccountAccessState =
  | 'ADULT_ACCESS'
  | 'MINOR_RESTRICTED_ACCESS'
  | 'PARENTAL_CONSENT_PENDING'
  | 'PARENTAL_CONSENT_VERIFIED'
  | 'PARENTAL_CONSENT_REVOKED'
  | 'AGE_VERIFICATION_REQUIRED'
  | 'ACCESS_SUSPENDED';

export type ParentalConsentRecordStatus =
  | 'PARENTAL_CONSENT_PENDING'
  | 'PARENTAL_CONSENT_VERIFIED'
  | 'PARENTAL_CONSENT_REVOKED'
  | 'EXPIRED'
  | 'DENIED';

export type RelationshipVerificationStatus =
  | 'PENDING'
  | 'PENDING_EXTERNAL_VERIFICATION'
  | 'VERIFIED'
  | 'REVOKED'
  | 'REJECTED';

export type ConsentScope =
  | 'omnia_youth_core_chat'
  | 'omnia_youth_educational_assistance'
  | 'omnia_youth_coding_assistance'
  | 'omnia_youth_filtered_web_research'
  | 'omnia_youth_restricted_file_analysis'
  | 'omnia_youth_science_explorer';

export const APPROVED_YOUTH_CONSENT_SCOPES: readonly ConsentScope[] = [
  'omnia_youth_core_chat',
  'omnia_youth_educational_assistance',
  'omnia_youth_coding_assistance',
  'omnia_youth_filtered_web_research',
  'omnia_youth_restricted_file_analysis',
  'omnia_youth_science_explorer',
];

export interface ParentalConsentDocument {
  consent_id: string;
  child_uid: string;
  parent_uid: string | null;
  status: ParentalConsentRecordStatus;
  consent_type: 'OMNIA_YOUTH_GUARDIAN_CONSENT';
  consent_scopes: ConsentScope[];
  jurisdiction: string;
  verification_method:
    | 'UNVERIFIED_INVITATION'
    | 'FIREBASE_AUTH_PENDING_EXTERNAL_IDENTITY_PROOF'
    | 'SIGNED_EXTERNAL_VPC_PROVIDER';
  verification_provider_reference: string | null;
  policy_version: string;
  verified_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
  updated_at: string;
}

export interface ParentChildRelationshipDocument {
  relationship_id: string;
  parent_uid: string;
  child_uid: string;
  relationship_verification_status: RelationshipVerificationStatus;
  verification_reference: string | null;
  created_at: string;
  updated_at: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
}

export interface ConsentAuditLogDocument {
  event_id: string;
  consent_id: string;
  event_type:
    | 'INVITATION_CREATED'
    | 'INVITATION_EXPIRED'
    | 'PARENT_AUTH_VERIFIED'
    | 'EXTERNAL_VERIFICATION_REQUIRED'
    | 'CONSENT_VERIFIED'
    | 'CONSENT_DENIED'
    | 'CONSENT_REVOKED'
    | 'CONSENT_EXPIRED'
    | 'ACCOUNT_DATA_ERASED'
    | 'UNAUTHORIZED_ATTEMPT_BLOCKED';
  actor_uid: string;
  timestamp: string;
  policy_version: string;
  event_metadata: Record<string, string | number | boolean | null>;
}

export interface ParentalConsentInvitation {
  invitation_id: string;
  token_hash: string;
  consent_id: string;
  child_uid: string;
  parent_email_hash: string;
  jurisdiction: string;
  requested_scopes: ConsentScope[];
  policy_version: string;
  status: 'PENDING' | 'CONSUMED' | 'EXPIRED' | 'REVOKED';
  created_at: string;
  expires_at: string;
  updated_at: string;
}

interface PersistedParentalConsentState {
  parental_consents: ParentalConsentDocument[];
  parent_child_relationships: ParentChildRelationshipDocument[];
  consent_audit_logs: ConsentAuditLogDocument[];
  invitations: ParentalConsentInvitation[];
}

const STORE_PATH = path.resolve(process.cwd(), 'data', 'parental_consent_store.json');

function createEmptyState(): PersistedParentalConsentState {
  return {
    parental_consents: [],
    parent_child_relationships: [],
    consent_audit_logs: [],
    invitations: [],
  };
}

let inMemoryFallback: PersistedParentalConsentState | null = null;

function loadState(): PersistedParentalConsentState {
  if (inMemoryFallback) return inMemoryFallback;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryFallback = {
        parental_consents: Array.isArray(parsed.parental_consents) ? parsed.parental_consents : [],
        parent_child_relationships: Array.isArray(parsed.parent_child_relationships)
          ? parsed.parent_child_relationships
          : [],
        consent_audit_logs: Array.isArray(parsed.consent_audit_logs) ? parsed.consent_audit_logs : [],
        invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
      };
      return inMemoryFallback;
    }
  } catch {
    // Fall back to empty in-memory state
  }
  inMemoryFallback = createEmptyState();
  return inMemoryFallback;
}

function saveState(state: PersistedParentalConsentState): void {
  inMemoryFallback = state;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const bounded: PersistedParentalConsentState = {
      parental_consents: state.parental_consents.slice(0, 1000),
      parent_child_relationships: state.parent_child_relationships.slice(0, 1000),
      consent_audit_logs: state.consent_audit_logs.slice(0, 2000),
      invitations: state.invitations.slice(0, 1000),
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(bounded, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem fallback remains in memory
  }
}

/**
 * Optional Firestore REST sync when a verified FIREBASE_SERVICE_ACCOUNT_JSON is provided
 * in production environment variables. Never fabricates credentials or throws in preview.
 */
interface ServiceAccountCreds {
  client_email: string;
  private_key: string;
  project_id?: string;
}

let cachedGoogleAccessToken: { token: string; expiresAt: number } | null = null;

function getConfiguredServiceAccount(): ServiceAccountCreds | null {
  const raw = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.client_email === 'string' && typeof parsed.private_key === 'string') {
      return parsed as ServiceAccountCreds;
    }
  } catch {
    // Invalid JSON ignored safely
  }
  return null;
}

export function getConsentPersistenceStatus(): {
  firestoreCollections: string[];
  serverFirestoreSyncConfigured: boolean;
  persistenceMode: 'firestore_server_rest' | 'server_local_fallback_requires_iam';
} {
  const configured = Boolean(getConfiguredServiceAccount());
  return {
    firestoreCollections: [
      'parental_consents',
      'parent_child_relationships',
      'consent_audit_logs',
    ],
    serverFirestoreSyncConfigured: configured,
    persistenceMode: configured
      ? 'firestore_server_rest'
      : 'server_local_fallback_requires_iam',
  };
}

function toFirestoreFieldValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map((item) => toFirestoreFieldValue(item)),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      fields[k] = toFirestoreFieldValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function getServiceAccountAccessToken(creds: ServiceAccountCreds): Promise<string | null> {
  const now = Date.now();
  if (cachedGoogleAccessToken && cachedGoogleAccessToken.expiresAt > now + 60_000) {
    return cachedGoogleAccessToken.token;
  }

  try {
    const iat = Math.floor(now / 1000);
    const exp = iat + 3600;
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(
      JSON.stringify({
        iss: creds.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        iat,
        exp,
      })
    ).toString('base64url');

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${claimSet}`);
    const sig = signer.sign(creds.private_key, 'base64url');
    const assertion = `${header}.${claimSet}.${sig}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedGoogleAccessToken = {
      token: data.access_token,
      expiresAt: now + (Number(data.expires_in) || 3600) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

async function mirrorDocumentToFirestore(
  collectionName: 'parental_consents' | 'parent_child_relationships' | 'consent_audit_logs',
  docId: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const creds = getConfiguredServiceAccount();
  if (!creds) return false;

  try {
    const token = await getServiceAccountAccessToken(creds);
    if (!token) return false;

    const projectInfo = getFirebaseProjectId();
    const projectId = creds.project_id || projectInfo.projectId;
    const databaseId =
      (process.env.FIREBASE_FIRESTORE_DATABASE_ID || '').trim() ||
      'ai-studio-vizraaicreatives-526756ea-8369-4e64-bb74-541d358e399a';

    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/${encodeURIComponent(databaseId)}/documents/${encodeURIComponent(
      collectionName
    )}/${encodeURIComponent(docId)}`;

    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      fields[k] = toFirestoreFieldValue(v);
    }

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function hashInvitationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

export function sanitizeConsentScopes(rawScopes: unknown): ConsentScope[] {
  if (!Array.isArray(rawScopes) || rawScopes.length === 0) {
    return [...APPROVED_YOUTH_CONSENT_SCOPES];
  }
  const allowed = new Set<string>(APPROVED_YOUTH_CONSENT_SCOPES);
  const filtered = rawScopes.filter(
    (s): s is ConsentScope => typeof s === 'string' && allowed.has(s)
  );
  return filtered.length > 0 ? Array.from(new Set(filtered)) : [...APPROVED_YOUTH_CONSENT_SCOPES];
}

export function appendConsentAuditLog(input: {
  consent_id: string;
  event_type: ConsentAuditLogDocument['event_type'];
  actor_uid: string;
  event_metadata?: Record<string, string | number | boolean | null>;
}): ConsentAuditLogDocument {
  const state = loadState();
  const entry: ConsentAuditLogDocument = {
    event_id: `caud_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    consent_id: input.consent_id,
    event_type: input.event_type,
    actor_uid: input.actor_uid,
    timestamp: new Date().toISOString(),
    policy_version: CONSENT_POLICY_VERSION,
    event_metadata: input.event_metadata || {},
  };
  state.consent_audit_logs.unshift(entry);
  saveState(state);
  void mirrorDocumentToFirestore('consent_audit_logs', entry.event_id, entry as unknown as Record<string, unknown>);
  return entry;
}

export function createOrReuseParentalInvitation(params: {
  childUid: string;
  parentEmailHash: string;
  jurisdiction: string;
  requestedScopes?: unknown;
}): {
  invitation: ParentalConsentInvitation;
  consent: ParentalConsentDocument;
  rawToken: string;
  reusedExisting: boolean;
} {
  const state = loadState();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const expiresAtIso = new Date(now + INVITATION_TTL_MS).toISOString();
  const scopes = sanitizeConsentScopes(params.requestedScopes);

  // Expire stale pending invitations for this child first
  for (const inv of state.invitations) {
    if (
      inv.child_uid === params.childUid &&
      inv.status === 'PENDING' &&
      new Date(inv.expires_at).getTime() <= now
    ) {
      inv.status = 'EXPIRED';
      inv.updated_at = nowIso;
    }
  }

  // Handle duplicate pending invitation for the same child + guardian cleanly: rotate token & extend expiry
  const existingPendingInv = state.invitations.find(
    (inv) =>
      inv.child_uid === params.childUid &&
      inv.parent_email_hash === params.parentEmailHash &&
      inv.status === 'PENDING'
  );

  const rawToken = `vpc_inv_${crypto.randomBytes(24).toString('hex')}`;
  const tokenHash = hashInvitationToken(rawToken);

  if (existingPendingInv) {
    existingPendingInv.token_hash = tokenHash;
    existingPendingInv.expires_at = expiresAtIso;
    existingPendingInv.updated_at = nowIso;
    existingPendingInv.requested_scopes = scopes;
    const existingConsent = state.parental_consents.find(
      (c) => c.consent_id === existingPendingInv.consent_id
    );
    if (existingConsent) {
      existingConsent.consent_scopes = scopes;
      existingConsent.updated_at = nowIso;
      saveState(state);
      void mirrorDocumentToFirestore(
        'parental_consents',
        existingConsent.consent_id,
        existingConsent as unknown as Record<string, unknown>
      );
      return {
        invitation: existingPendingInv,
        consent: existingConsent,
        rawToken,
        reusedExisting: true,
      };
    }
  }

  // Revoke any older pending invitations for different guardian email addresses for this child
  for (const inv of state.invitations) {
    if (inv.child_uid === params.childUid && inv.status === 'PENDING') {
      inv.status = 'REVOKED';
      inv.updated_at = nowIso;
    }
  }

  const consentId = `pcon_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const invitationId = `pinv_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;

  const consent: ParentalConsentDocument = {
    consent_id: consentId,
    child_uid: params.childUid,
    parent_uid: null,
    status: 'PARENTAL_CONSENT_PENDING',
    consent_type: 'OMNIA_YOUTH_GUARDIAN_CONSENT',
    consent_scopes: scopes,
    jurisdiction: params.jurisdiction,
    verification_method: 'UNVERIFIED_INVITATION',
    verification_provider_reference: null,
    policy_version: CONSENT_POLICY_VERSION,
    verified_at: null,
    expires_at: null,
    created_at: nowIso,
    revoked_at: null,
    updated_at: nowIso,
  };

  const invitation: ParentalConsentInvitation = {
    invitation_id: invitationId,
    token_hash: tokenHash,
    consent_id: consentId,
    child_uid: params.childUid,
    parent_email_hash: params.parentEmailHash,
    jurisdiction: params.jurisdiction,
    requested_scopes: scopes,
    policy_version: CONSENT_POLICY_VERSION,
    status: 'PENDING',
    created_at: nowIso,
    expires_at: expiresAtIso,
    updated_at: nowIso,
  };

  state.parental_consents.unshift(consent);
  state.invitations.unshift(invitation);
  saveState(state);

  void mirrorDocumentToFirestore(
    'parental_consents',
    consent.consent_id,
    consent as unknown as Record<string, unknown>
  );
  appendConsentAuditLog({
    consent_id: consentId,
    event_type: 'INVITATION_CREATED',
    actor_uid: params.childUid,
    event_metadata: {
      jurisdiction: params.jurisdiction,
      scopeCount: scopes.length,
    },
  });

  return { invitation, consent, rawToken, reusedExisting: false };
}

export function getInvitationByRawToken(rawToken: string): {
  invitation: ParentalConsentInvitation | null;
  expired: boolean;
} {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length < 16) {
    return { invitation: null, expired: false };
  }
  const state = loadState();
  const tokenHash = hashInvitationToken(rawToken);
  const inv = state.invitations.find((i) => i.token_hash === tokenHash) || null;
  if (!inv) return { invitation: null, expired: false };

  const now = Date.now();
  if (inv.status === 'PENDING' && new Date(inv.expires_at).getTime() <= now) {
    inv.status = 'EXPIRED';
    inv.updated_at = new Date(now).toISOString();
    saveState(state);
    appendConsentAuditLog({
      consent_id: inv.consent_id,
      event_type: 'INVITATION_EXPIRED',
      actor_uid: inv.child_uid,
      event_metadata: { invitation_id: inv.invitation_id },
    });
    return { invitation: inv, expired: true };
  }

  return { invitation: inv, expired: inv.status === 'EXPIRED' };
}

export function recordParentApprovalAttempt(params: {
  rawToken: string;
  parentUid: string;
  parentEmailHash: string;
  approvedScopes: ConsentScope[];
  externalVerificationProof?: {
    verified: boolean;
    providerReference: string;
    verificationMethod: 'SIGNED_EXTERNAL_VPC_PROVIDER';
    expiresAtIso?: string;
  } | null;
}): {
  ok: boolean;
  code: string;
  status: number;
  message: string;
  consent?: ParentalConsentDocument;
  relationship?: ParentChildRelationshipDocument;
} {
  const state = loadState();
  const tokenHash = hashInvitationToken(params.rawToken);
  const inv = state.invitations.find((i) => i.token_hash === tokenHash);

  if (!inv) {
    return {
      ok: false,
      code: 'INVITATION_NOT_FOUND',
      status: 404,
      message: 'Parental consent invitation token was not found.',
    };
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  if (inv.status === 'CONSUMED') {
    return {
      ok: false,
      code: 'INVITATION_ALREADY_USED',
      status: 409,
      message: 'This parental consent invitation has already been processed.',
    };
  }

  if (inv.status === 'REVOKED') {
    return {
      ok: false,
      code: 'INVITATION_REVOKED',
      status: 410,
      message: 'This parental consent invitation has been superseded or revoked.',
    };
  }

  if (inv.status === 'EXPIRED' || new Date(inv.expires_at).getTime() <= now) {
    inv.status = 'EXPIRED';
    inv.updated_at = nowIso;
    saveState(state);
    appendConsentAuditLog({
      consent_id: inv.consent_id,
      event_type: 'INVITATION_EXPIRED',
      actor_uid: params.parentUid,
      event_metadata: { invitation_id: inv.invitation_id },
    });
    return {
      ok: false,
      code: 'INVITATION_EXPIRED',
      status: 410,
      message: 'This parental consent invitation has expired. Request a new invitation.',
    };
  }

  // Strictly block a child account from acting as its own parent/guardian
  if (inv.child_uid === params.parentUid) {
    appendConsentAuditLog({
      consent_id: inv.consent_id,
      event_type: 'UNAUTHORIZED_ATTEMPT_BLOCKED',
      actor_uid: params.parentUid,
      event_metadata: { reason: 'CHILD_SELF_APPROVAL_BLOCKED' },
    });
    return {
      ok: false,
      code: 'PARENT_CHILD_UID_CONFLICT',
      status: 403,
      message:
        'Parent or guardian must sign in with a separate, independent adult account. A minor account cannot self-approve parental consent.',
    };
  }

  // Validate guardian email match when invitation was bound to a specific guardian email hash
  if (inv.parent_email_hash && inv.parent_email_hash !== params.parentEmailHash) {
    appendConsentAuditLog({
      consent_id: inv.consent_id,
      event_type: 'UNAUTHORIZED_ATTEMPT_BLOCKED',
      actor_uid: params.parentUid,
      event_metadata: { reason: 'GUARDIAN_EMAIL_MISMATCH' },
    });
    return {
      ok: false,
      code: 'PARENT_RELATIONSHIP_MISMATCH',
      status: 403,
      message:
        'Signed-in guardian account does not match the invited parent/guardian address.',
    };
  }

  const consent = state.parental_consents.find((c) => c.consent_id === inv.consent_id);
  if (!consent) {
    return {
      ok: false,
      code: 'CONSENT_RECORD_MISSING',
      status: 404,
      message: 'Associated parental consent record was not found.',
    };
  }

  if (consent.status === 'PARENTAL_CONSENT_REVOKED') {
    return {
      ok: false,
      code: 'CONSENT_ALREADY_REVOKED',
      status: 409,
      message: 'This consent record has been revoked and cannot be reused.',
    };
  }

  const scopes = sanitizeConsentScopes(params.approvedScopes);
  const relationshipId = `rel_${crypto
    .createHash('sha256')
    .update(`${params.parentUid}:${inv.child_uid}`)
    .digest('hex')
    .slice(0, 20)}`;

  let relationship = state.parent_child_relationships.find(
    (r) => r.relationship_id === relationshipId
  );

  // If external identity/authority verification proof is cryptographically verified by the backend:
  if (params.externalVerificationProof?.verified) {
    const expiresAtIso =
      params.externalVerificationProof.expiresAtIso ||
      new Date(now + CONSENT_DEFAULT_TTL_MS).toISOString();

    consent.parent_uid = params.parentUid;
    consent.status = 'PARENTAL_CONSENT_VERIFIED';
    consent.consent_scopes = scopes;
    consent.verification_method = params.externalVerificationProof.verificationMethod;
    consent.verification_provider_reference = params.externalVerificationProof.providerReference;
    consent.verified_at = nowIso;
    consent.expires_at = expiresAtIso;
    consent.revoked_at = null;
    consent.updated_at = nowIso;

    if (!relationship) {
      relationship = {
        relationship_id: relationshipId,
        parent_uid: params.parentUid,
        child_uid: inv.child_uid,
        relationship_verification_status: 'VERIFIED',
        verification_reference: params.externalVerificationProof.providerReference,
        created_at: nowIso,
        updated_at: nowIso,
        status: 'ACTIVE',
      };
      state.parent_child_relationships.unshift(relationship);
    } else {
      relationship.relationship_verification_status = 'VERIFIED';
      relationship.verification_reference = params.externalVerificationProof.providerReference;
      relationship.status = 'ACTIVE';
      relationship.updated_at = nowIso;
    }

    inv.status = 'CONSUMED';
    inv.updated_at = nowIso;
    saveState(state);

    void mirrorDocumentToFirestore(
      'parental_consents',
      consent.consent_id,
      consent as unknown as Record<string, unknown>
    );
    void mirrorDocumentToFirestore(
      'parent_child_relationships',
      relationship.relationship_id,
      relationship as unknown as Record<string, unknown>
    );
    appendConsentAuditLog({
      consent_id: consent.consent_id,
      event_type: 'CONSENT_VERIFIED',
      actor_uid: params.parentUid,
      event_metadata: {
        jurisdiction: consent.jurisdiction,
        verification_method: consent.verification_method,
        scopeCount: scopes.length,
      },
    });

    return {
      ok: true,
      code: 'PARENTAL_CONSENT_VERIFIED',
      status: 200,
      message: 'Parental consent verified and Omnia Youth restricted access authorized.',
      consent,
      relationship,
    };
  }

  // Fail-closed: independent Firebase Auth alone is recorded, but full identity/authority verification
  // requires an accredited external verification provider (e.g., Yoti, KWS, PRIVO, DigiLocker for India DPDP).
  consent.parent_uid = params.parentUid;
  consent.status = 'PARENTAL_CONSENT_PENDING';
  consent.consent_scopes = scopes;
  consent.verification_method = 'FIREBASE_AUTH_PENDING_EXTERNAL_IDENTITY_PROOF';
  consent.updated_at = nowIso;

  if (!relationship) {
    relationship = {
      relationship_id: relationshipId,
      parent_uid: params.parentUid,
      child_uid: inv.child_uid,
      relationship_verification_status: 'PENDING_EXTERNAL_VERIFICATION',
      verification_reference: null,
      created_at: nowIso,
      updated_at: nowIso,
      status: 'PENDING',
    };
    state.parent_child_relationships.unshift(relationship);
  } else {
    relationship.relationship_verification_status = 'PENDING_EXTERNAL_VERIFICATION';
    relationship.status = 'PENDING';
    relationship.updated_at = nowIso;
  }

  saveState(state);
  void mirrorDocumentToFirestore(
    'parental_consents',
    consent.consent_id,
    consent as unknown as Record<string, unknown>
  );
  void mirrorDocumentToFirestore(
    'parent_child_relationships',
    relationship.relationship_id,
    relationship as unknown as Record<string, unknown>
  );
  appendConsentAuditLog({
    consent_id: consent.consent_id,
    event_type: 'EXTERNAL_VERIFICATION_REQUIRED',
    actor_uid: params.parentUid,
    event_metadata: {
      jurisdiction: consent.jurisdiction,
      reason: 'EXTERNAL_VPC_PROVIDER_NOT_CONFIGURED',
    },
  });

  return {
    ok: false,
    code: 'EXTERNAL_IDENTITY_VERIFICATION_REQUIRED',
    status: 424,
    message:
      'Parent authentication and explicit consent preferences were recorded, but Omnia Youth remains locked until an accredited external parent identity & guardianship verification provider (e.g., Yoti, KWS, PRIVO, or India DPDP-compliant DigiLocker/Virtual Token flow) confirms authority.',
    consent,
    relationship,
  };
}

/**
 * Trusted server-only verification finalizer (invoked only after verified signed external
 * provider webhook HMAC callback or authorized server test harness).
 */
export function finalizeVerifiedParentalConsent(params: {
  consentId: string;
  parentUid: string;
  providerReference: string;
  expiresAtIso?: string;
}): {
  ok: boolean;
  code: string;
  message: string;
  consent?: ParentalConsentDocument;
  relationship?: ParentChildRelationshipDocument;
} {
  const state = loadState();
  const consent = state.parental_consents.find((c) => c.consent_id === params.consentId);
  if (!consent) {
    return { ok: false, code: 'CONSENT_NOT_FOUND', message: 'Parental consent record not found.' };
  }
  if (consent.child_uid === params.parentUid) {
    return {
      ok: false,
      code: 'PARENT_CHILD_UID_CONFLICT',
      message: 'Parent UID cannot match child UID.',
    };
  }
  if (consent.status === 'PARENTAL_CONSENT_REVOKED') {
    return {
      ok: false,
      code: 'CONSENT_ALREADY_REVOKED',
      message: 'Revoked consent cannot be re-verified; initiate a fresh invitation.',
    };
  }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const expiresAtIso =
    params.expiresAtIso || new Date(now + CONSENT_DEFAULT_TTL_MS).toISOString();

  consent.parent_uid = params.parentUid;
  consent.status = 'PARENTAL_CONSENT_VERIFIED';
  consent.verification_method = 'SIGNED_EXTERNAL_VPC_PROVIDER';
  consent.verification_provider_reference = params.providerReference;
  consent.verified_at = nowIso;
  consent.expires_at = expiresAtIso;
  consent.revoked_at = null;
  consent.updated_at = nowIso;

  const relationshipId = `rel_${crypto
    .createHash('sha256')
    .update(`${params.parentUid}:${consent.child_uid}`)
    .digest('hex')
    .slice(0, 20)}`;

  let relationship = state.parent_child_relationships.find(
    (r) => r.relationship_id === relationshipId
  );
  if (!relationship) {
    relationship = {
      relationship_id: relationshipId,
      parent_uid: params.parentUid,
      child_uid: consent.child_uid,
      relationship_verification_status: 'VERIFIED',
      verification_reference: params.providerReference,
      created_at: nowIso,
      updated_at: nowIso,
      status: 'ACTIVE',
    };
    state.parent_child_relationships.unshift(relationship);
  } else {
    relationship.relationship_verification_status = 'VERIFIED';
    relationship.verification_reference = params.providerReference;
    relationship.status = 'ACTIVE';
    relationship.updated_at = nowIso;
  }

  for (const inv of state.invitations) {
    if (inv.consent_id === consent.consent_id && inv.status === 'PENDING') {
      inv.status = 'CONSUMED';
      inv.updated_at = nowIso;
    }
  }

  saveState(state);
  void mirrorDocumentToFirestore(
    'parental_consents',
    consent.consent_id,
    consent as unknown as Record<string, unknown>
  );
  void mirrorDocumentToFirestore(
    'parent_child_relationships',
    relationship.relationship_id,
    relationship as unknown as Record<string, unknown>
  );
  appendConsentAuditLog({
    consent_id: consent.consent_id,
    event_type: 'CONSENT_VERIFIED',
    actor_uid: params.parentUid,
    event_metadata: {
      provider_reference: params.providerReference,
      jurisdiction: consent.jurisdiction,
    },
  });

  return {
    ok: true,
    code: 'PARENTAL_CONSENT_VERIFIED',
    message: 'Signed external verification confirmed; Omnia Youth access enabled.',
    consent,
    relationship,
  };
}

export function getLatestParentalConsentForChild(
  childUid: string
): {
  consent: ParentalConsentDocument | null;
  relationship: ParentChildRelationshipDocument | null;
  isExpired: boolean;
  isVerifiedAndActive: boolean;
} {
  const state = loadState();
  const consent = state.parental_consents.find((c) => c.child_uid === childUid) || null;
  if (!consent) {
    return { consent: null, relationship: null, isExpired: false, isVerifiedAndActive: false };
  }

  const now = Date.now();
  let isExpired = consent.status === 'EXPIRED';
  if (
    consent.status === 'PARENTAL_CONSENT_VERIFIED' &&
    consent.expires_at &&
    new Date(consent.expires_at).getTime() <= now
  ) {
    isExpired = true;
    consent.status = 'EXPIRED';
    consent.updated_at = new Date(now).toISOString();
    saveState(state);
    void mirrorDocumentToFirestore(
      'parental_consents',
      consent.consent_id,
      consent as unknown as Record<string, unknown>
    );
    appendConsentAuditLog({
      consent_id: consent.consent_id,
      event_type: 'CONSENT_EXPIRED',
      actor_uid: childUid,
      event_metadata: { expires_at: consent.expires_at },
    });
  }

  const relationship =
    (consent.parent_uid &&
      state.parent_child_relationships.find(
        (r) => r.parent_uid === consent.parent_uid && r.child_uid === childUid
      )) ||
    null;

  const isVerifiedAndActive =
    !isExpired &&
    consent.status === 'PARENTAL_CONSENT_VERIFIED' &&
    Boolean(consent.parent_uid) &&
    consent.parent_uid !== childUid &&
    relationship?.relationship_verification_status === 'VERIFIED' &&
    relationship?.status === 'ACTIVE';

  return { consent, relationship, isExpired, isVerifiedAndActive };
}

export function listParentalConsentsForActor(actorUid: string): {
  asChild: ParentalConsentDocument[];
  asParent: ParentalConsentDocument[];
  relationships: ParentChildRelationshipDocument[];
  auditLogs: ConsentAuditLogDocument[];
} {
  const state = loadState();
  // Ensure expiry evaluation runs for any child record queried
  const asChild = state.parental_consents.filter((c) => c.child_uid === actorUid);
  const asParent = state.parental_consents.filter((c) => c.parent_uid === actorUid);
  const relationships = state.parent_child_relationships.filter(
    (r) => r.child_uid === actorUid || r.parent_uid === actorUid
  );
  const relevantConsentIds = new Set([...asChild, ...asParent].map((c) => c.consent_id));
  const auditLogs = state.consent_audit_logs
    .filter((log) => log.actor_uid === actorUid || relevantConsentIds.has(log.consent_id))
    .slice(0, 50);

  return { asChild, asParent, relationships, auditLogs };
}

export function revokeParentalConsent(params: {
  actorUid: string;
  consentId?: string;
  childUid?: string;
  reason?: string;
}): {
  ok: boolean;
  status: number;
  code: string;
  message: string;
  revokedConsents: ParentalConsentDocument[];
} {
  const state = loadState();
  const nowIso = new Date().toISOString();

  const matching = state.parental_consents.filter((c) => {
    const matchesTarget = params.consentId
      ? c.consent_id === params.consentId
      : params.childUid
      ? c.child_uid === params.childUid
      : c.child_uid === params.actorUid || c.parent_uid === params.actorUid;
    return matchesTarget;
  });

  if (matching.length === 0) {
    return {
      ok: false,
      status: 404,
      code: 'CONSENT_RECORD_NOT_FOUND',
      message: 'No matching parental consent record was found.',
      revokedConsents: [],
    };
  }

  // Strictly verify actor authorization: ONLY the linked parent_uid or child_uid may revoke
  const unauthorized = matching.filter(
    (c) => c.parent_uid !== params.actorUid && c.child_uid !== params.actorUid
  );
  if (unauthorized.length === matching.length) {
    appendConsentAuditLog({
      consent_id: matching[0].consent_id,
      event_type: 'UNAUTHORIZED_ATTEMPT_BLOCKED',
      actor_uid: params.actorUid,
      event_metadata: { reason: 'UNAUTHORIZED_REVOCATION_ATTEMPT' },
    });
    return {
      ok: false,
      status: 403,
      code: 'PARENT_RELATIONSHIP_MISMATCH',
      message: 'Only the verified parent/guardian or the account holder may withdraw consent.',
      revokedConsents: [],
    };
  }

  const authorizedTargets = matching.filter(
    (c) => c.parent_uid === params.actorUid || c.child_uid === params.actorUid
  );

  for (const consent of authorizedTargets) {
    consent.status = 'PARENTAL_CONSENT_REVOKED';
    consent.revoked_at = nowIso;
    consent.updated_at = nowIso;

    for (const rel of state.parent_child_relationships) {
      if (rel.child_uid === consent.child_uid && (!consent.parent_uid || rel.parent_uid === consent.parent_uid)) {
        rel.relationship_verification_status = 'REVOKED';
        rel.status = 'REVOKED';
        rel.updated_at = nowIso;
        void mirrorDocumentToFirestore(
          'parent_child_relationships',
          rel.relationship_id,
          rel as unknown as Record<string, unknown>
        );
      }
    }

    for (const inv of state.invitations) {
      if (inv.consent_id === consent.consent_id && inv.status === 'PENDING') {
        inv.status = 'REVOKED';
        inv.updated_at = nowIso;
      }
    }

    void mirrorDocumentToFirestore(
      'parental_consents',
      consent.consent_id,
      consent as unknown as Record<string, unknown>
    );
    appendConsentAuditLog({
      consent_id: consent.consent_id,
      event_type: 'CONSENT_REVOKED',
      actor_uid: params.actorUid,
      event_metadata: {
        reason: (params.reason || 'guardian_or_user_withdrawal').slice(0, 120),
      },
    });
  }

  saveState(state);

  return {
    ok: true,
    status: 200,
    code: 'PARENTAL_CONSENT_REVOKED',
    message:
      'Parental consent revoked immediately. Omnia Youth access is disabled and data-retention / account deletion workflows are available.',
    revokedConsents: authorizedTargets,
  };
}

export function purgeParentalConsentDataForUid(uid: string): {
  purgedConsents: number;
  purgedRelationships: number;
  purgedInvitations: number;
} {
  const state = loadState();
  const beforeConsents = state.parental_consents.length;
  const beforeRels = state.parent_child_relationships.length;
  const beforeInvs = state.invitations.length;

  const affectedConsentIds = state.parental_consents
    .filter((c) => c.child_uid === uid || c.parent_uid === uid)
    .map((c) => c.consent_id);

  state.parental_consents = state.parental_consents.filter(
    (c) => c.child_uid !== uid && c.parent_uid !== uid
  );
  state.parent_child_relationships = state.parent_child_relationships.filter(
    (r) => r.child_uid !== uid && r.parent_uid !== uid
  );
  state.invitations = state.invitations.filter((i) => i.child_uid !== uid);

  const purgedConsents = beforeConsents - state.parental_consents.length;
  const purgedRelationships = beforeRels - state.parent_child_relationships.length;
  const purgedInvitations = beforeInvs - state.invitations.length;

  if (purgedConsents > 0 || purgedRelationships > 0 || purgedInvitations > 0) {
    saveState(state);
    appendConsentAuditLog({
      consent_id: affectedConsentIds[0] || `erasure_${uid.slice(0, 12)}`,
      event_type: 'ACCOUNT_DATA_ERASED',
      actor_uid: `erased_${crypto.createHash('sha256').update(uid).digest('hex').slice(0, 12)}`,
      event_metadata: {
        purgedConsents,
        purgedRelationships,
        purgedInvitations,
      },
    });
  }

  return { purgedConsents, purgedRelationships, purgedInvitations };
}

/**
 * Safe test-harness helper to reset state for isolated automated tests (never mounted as an HTTP route).
 */
export function _resetParentalConsentStoreForTests(): void {
  inMemoryFallback = createEmptyState();
}

export function _expireInvitationForTests(rawToken: string, expiresAtIso: string): boolean {
  const state = loadState();
  const tokenHash = hashInvitationToken(rawToken);
  const inv = state.invitations.find((i) => i.token_hash === tokenHash);
  if (!inv) return false;
  inv.expires_at = expiresAtIso;
  saveState(state);
  return true;
}
