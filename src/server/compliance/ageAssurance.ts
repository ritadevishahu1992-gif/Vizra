import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { generalApiRateLimiter, derivePrivacySessionHash, safeCompare } from '../security';
import { verifyFirebaseIdToken } from '../authVerification';

/**
 * Policy governance flags.
 * ACTIVE_AGE_POLICY stays 'STRICT_18_PLUS' until formal legal approval and
 * an accredited external verifiable parental consent vendor are integrated.
 * OPTION_2_ACTIVE stays FALSE (dormant preparatory engineering).
 * OPTION_5_REJECTED stays TRUE (permanently rejected by project owner).
 */
export const ACTIVE_AGE_POLICY = 'STRICT_18_PLUS' as const;
export const OPTION_2_ACTIVE = false;
export const OPTION_5_REJECTED = true;

export type AgeBracket =
  | 'UNDER_13_BLOCKED'
  | 'TEEN_13_17_PENDING_PARENTAL_CONSENT'
  | 'ADULT_18_PLUS';

export type ConsentLifecycleStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_VENDOR_VERIFICATION'
  | 'BLOCKED_BY_EXTERNAL_DEPENDENCY'
  | 'VERIFIED'
  | 'WITHDRAWN'
  | 'REVOKED';

export type MinorProtectionTier =
  | 'ADULT_STANDARD'
  | 'RESTRICTED_MINOR_SAFE'
  | 'BLOCKED';

export type FeatureAccessKey =
  | 'chat_basic'
  | 'web_research_safe'
  | 'science_educational'
  | 'voice_live'
  | 'unrestricted_creative_studio'
  | 'third_party_workspace_oauth'
  | 'paid_billing'
  | 'commercial_engage_targeting';

export interface JurisdictionConsentRule {
  code: string;
  label: string;
  digitalConsentAge: number;
  adultMajorityAge: number;
  applicableStatutes: string[];
  parentalConsentRuleSummary: string;
  counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF';
}

/**
 * International statutory digital consent age reference table.
 * Prevents assuming a single global threshold across US, EU member states, UK, India, etc.
 */
export const JURISDICTION_CONSENT_THRESHOLDS: Record<string, JurisdictionConsentRule> = {
  US: {
    code: 'US',
    label: 'United States',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: ['US COPPA (15 U.S.C. §§ 6501–6506; 16 CFR Part 312)'],
    parentalConsentRuleSummary:
      'Verifiable Parental Consent (VPC) mandatory for personal data collection from children under 13.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  EU: {
    code: 'EU',
    label: 'European Union (GDPR Art. 8 Default)',
    digitalConsentAge: 16,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8'],
    parentalConsentRuleSummary:
      'Default GDPR Art. 8 digital consent age is 16 unless lowered by member-state law (range 13–16).',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  DE: {
    code: 'DE',
    label: 'Germany (EU GDPR Art. 8)',
    digitalConsentAge: 16,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 (Germany retains age 16 threshold)'],
    parentalConsentRuleSummary:
      'Verifiable holder-of-parental-responsibility consent required under age 16.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  NL: {
    code: 'NL',
    label: 'Netherlands (EU GDPR Art. 8 / UAVG)',
    digitalConsentAge: 16,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & Dutch UAVG Art. 5'],
    parentalConsentRuleSummary: 'Verifiable parental consent required under age 16.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  FR: {
    code: 'FR',
    label: 'France (EU GDPR Art. 8 / Loi Informatique et Libertés)',
    digitalConsentAge: 15,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & French Data Protection Act Art. 45'],
    parentalConsentRuleSummary:
      'Joint/parental authorization required below age 15 (plus French digital majority rules under 15).',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  IT: {
    code: 'IT',
    label: 'Italy (EU GDPR Art. 8 / Codice Privacy)',
    digitalConsentAge: 14,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & Italian Legislative Decree 101/2018'],
    parentalConsentRuleSummary: 'Parental authorization required below age 14.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  ES: {
    code: 'ES',
    label: 'Spain (EU GDPR Art. 8 / LOPDGDD)',
    digitalConsentAge: 14,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & Spanish LOPDGDD Art. 7'],
    parentalConsentRuleSummary: 'Holder-of-parental-responsibility consent required below age 14.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  SE: {
    code: 'SE',
    label: 'Sweden (EU GDPR Art. 8)',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 (Sweden 13-year threshold)'],
    parentalConsentRuleSummary: 'Parental consent required below age 13.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  UK: {
    code: 'UK',
    label: 'United Kingdom (UK GDPR Art. 8 & Age Appropriate Design Code)',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: [
      'UK GDPR Article 8',
      'UK ICO Age Appropriate Design Code (Children\'s Code, under 18)',
    ],
    parentalConsentRuleSummary:
      'Parental consent below 13 plus mandatory Age Appropriate Design Code high-privacy & safety defaults for all users under 18.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  GB: {
    code: 'GB',
    label: 'United Kingdom (GB ISO Code)',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: [
      'UK GDPR Article 8',
      'UK ICO Age Appropriate Design Code (Children\'s Code, under 18)',
    ],
    parentalConsentRuleSummary:
      'Parental consent below 13 plus mandatory Age Appropriate Design Code high-privacy & safety defaults for all users under 18.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  IN: {
    code: 'IN',
    label: 'India (DPDP Act 2023)',
    digitalConsentAge: 18,
    adultMajorityAge: 18,
    applicableStatutes: ['India Digital Personal Data Protection Act, 2023 (Section 2(f) & Section 9)'],
    parentalConsentRuleSummary:
      'Section 9 defines any individual under 18 as a child and requires Verifiable Parental Consent plus bans behavioral monitoring/targeted advertising aimed at children.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  GLOBAL: {
    code: 'GLOBAL',
    label: 'Conservative Global Baseline (Under-18 Protected)',
    digitalConsentAge: 18,
    adultMajorityAge: 18,
    applicableStatutes: [
      'Conservative Baseline (COPPA / GDPR Art. 8 / UK AADC / India DPDP Sec. 9)',
    ],
    parentalConsentRuleSummary:
      'Defaults to the strictest 18+ statutory standard unless a jurisdiction-specific verified workflow is approved by counsel.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
};

export function resolveJurisdictionRule(rawJurisdiction?: unknown): JurisdictionConsentRule {
  if (typeof rawJurisdiction === 'string' && rawJurisdiction.trim()) {
    const code = rawJurisdiction.trim().toUpperCase().slice(0, 12);
    if (JURISDICTION_CONSENT_THRESHOLDS[code]) {
      return JURISDICTION_CONSENT_THRESHOLDS[code];
    }
  }
  return JURISDICTION_CONSENT_THRESHOLDS.GLOBAL;
}

export interface AgeEvaluationResult {
  valid: boolean;
  error?: string;
  ageYears?: number;
  bracket?: AgeBracket;
  jurisdiction: string;
  digitalConsentAge: number;
  belowDigitalConsentThreshold: boolean;
  applicableStatutes: string[];
  legalBasisNote: string;
  activePolicyDecision: 'ALLOW_ADULT_18_PLUS' | 'DENY_UNDER_18_ACTIVE_POLICY';
  option2PreparatoryDecision:
    | 'BLOCKED_UNDER_13'
    | 'REQUIRES_VERIFIABLE_PARENTAL_CONSENT'
    | 'ELIGIBLE_ADULT';
  parentalVerificationRequired: boolean;
  parentalVerificationStatus:
    | 'NOT_REQUIRED'
    | 'BLOCKED_BY_EXTERNAL_DEPENDENCY';
}

export interface ParentalVerificationRequest {
  parentEmailHash: string;
  jurisdiction: string;
  subjectSessionHash: string;
  ageYears?: number;
}

export interface ParentalVerificationOutcome {
  verified: boolean;
  status: 'VERIFIED' | 'PENDING_VENDOR_VERIFICATION' | 'BLOCKED_BY_EXTERNAL_DEPENDENCY';
  code: string;
  message: string;
  providerName: string;
  recordId?: string;
}

export interface ParentalVerificationProvider {
  readonly providerName: string;
  readonly configured: boolean;
  initiateVerification(req: ParentalVerificationRequest): Promise<ParentalVerificationOutcome>;
  verifySignedCallback?(payload: string, signatureHeader: string): boolean;
}

/**
 * Fail-closed adapter ensuring minor access cannot silently auto-approve
 * when no third-party verifiable parental consent vendor is configured.
 */
export class UnconfiguredParentalVerificationProvider implements ParentalVerificationProvider {
  public readonly providerName = 'Verifiable Parental Consent Vendor (Unconfigured)';
  public readonly configured = false;

  async initiateVerification(_req: ParentalVerificationRequest): Promise<ParentalVerificationOutcome> {
    return {
      verified: false,
      status: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
      code: 'PARENTAL_VERIFICATION_VENDOR_NOT_CONFIGURED',
      message:
        'Verifiable parental consent requires an external age/guardian verification provider (e.g., Yoti, KWS, PRIVO) and formal counsel sign-off. Live teen onboarding remains dormant.',
      providerName: this.providerName,
    };
  }

  verifySignedCallback(_payload: string, _signatureHeader: string): boolean {
    return false;
  }
}

export interface AgeAssuranceConsentRecord {
  recordId: string;
  subjectHash: string;
  parentEmailHash?: string;
  bracket: AgeBracket;
  jurisdiction: string;
  digitalConsentAge: number;
  applicableStatutes: string[];
  activePolicy: typeof ACTIVE_AGE_POLICY;
  option2ActiveAtEvaluation: boolean;
  parentalConsentVerified: boolean;
  consentStatus: ConsentLifecycleStatus;
  minorProtectionTier: MinorProtectionTier;
  recordedAt: string;
  updatedAt: string;
  withdrawnAt?: string;
}

/**
 * Authoritative server-enforced Option 4 Feature Policy Matrix.
 */
export const AGE_FEATURE_POLICY_MATRIX: Record<
  FeatureAccessKey,
  {
    label: string;
    endpointOrSubsystem: string;
    allowedForUnder13: false;
    allowedForMinorSafeVerified: boolean;
    allowedForAdult18Plus: true;
    safeguardDescription: string;
  }
> = {
  chat_basic: {
    label: 'Omnia Supervised Text Chat',
    endpointOrSubsystem: 'POST /api/chat',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Enforces MINOR_SAFE_GEMINI_SAFETY_SETTINGS (BLOCK_LOW_AND_ABOVE) and MINOR_SAFE_SYSTEM_DIRECTIVE when minor-safe tier is active.',
  },
  web_research_safe: {
    label: 'Grounded Web Research',
    endpointOrSubsystem: 'POST /api/research',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Enforces MINOR_SAFE_GEMINI_SAFETY_SETTINGS and educational citation hygiene; blocks ungrounded unsafe content.',
  },
  science_educational: {
    label: 'Science Explorer (AlphaFold / PubChem / PubMed)',
    endpointOrSubsystem: 'POST /api/science/query',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Permitted for educational molecular/literature lookup under verified minor-safe mode.',
  },
  voice_live: {
    label: 'Live Multimodal Voice WebSocket',
    endpointOrSubsystem: 'POST /api/live/session & WS /live',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Restricted for all users under 18 to prevent unmoderated real-time audio interactions.',
  },
  unrestricted_creative_studio: {
    label: 'Unrestricted Creative & Lyria Audio Synthesis',
    endpointOrSubsystem: 'POST /api/music/generate',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Restricted for users under 18 under Option 4 age-appropriate creative safeguards.',
  },
  third_party_workspace_oauth: {
    label: 'External Workspace OAuth Connectors',
    endpointOrSubsystem: 'GET /api/integrations/:provider/auth-url',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Disabled for users under 18 to prevent third-party data sharing and external account linking.',
  },
  paid_billing: {
    label: 'Commercial Plans, Upgrades & Paid Credit Refills',
    endpointOrSubsystem: 'POST /api/credits/usage (pro/studio/refill)',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Financial upgrades and commercial credit refills disabled for users under 18.',
  },
  commercial_engage_targeting: {
    label: 'VIZRA Engage Sponsored & Affiliate Placements',
    endpointOrSubsystem: 'GET/POST /api/engage/select',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    safeguardDescription:
      'Suppresses all sponsored_card, affiliate_card, and commercial placements (UK AADC & India DPDP Sec. 9 alignment).',
  },
};

export const MINOR_SAFE_GEMINI_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

export const MINOR_SAFE_SYSTEM_DIRECTIVE = `[AGE-APPROPRIATE MINOR-SAFE GUARDRAIL]: You are operating under VIZRA's strict minor-protection policy. Do NOT generate sexually explicit/suggestive content, romantic roleplay, self-harm ideation, dangerous physical challenges, substance-use encouragement, gambling advice, financial solicitation, or age-inappropriate horror/violence. Maintain a constructive, educational, and supportive tone. Refuse unsafe requests calmly and redirect to safe educational topics.`;

const AGE_RECORDS_PATH = path.resolve(process.cwd(), 'data', 'age_assurance_records.json');

function loadAgeRecords(): AgeAssuranceConsentRecord[] {
  try {
    if (fs.existsSync(AGE_RECORDS_PATH)) {
      const raw = fs.readFileSync(AGE_RECORDS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // Fallback empty
  }
  return [];
}

function saveAgeRecords(records: AgeAssuranceConsentRecord[]): void {
  try {
    const dir = path.dirname(AGE_RECORDS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AGE_RECORDS_PATH, JSON.stringify(records.slice(0, 500), null, 2), 'utf-8');
  } catch {
    // Read-only fallback
  }
}

function upsertAgeRecord(record: AgeAssuranceConsentRecord): void {
  const existing = loadAgeRecords();
  existing.unshift(record);
  saveAgeRecords(existing);
}

/**
 * Removes all persisted age-assurance records matching any of the supplied raw subject seeds
 * (e.g. `uid:${uid}`, `client:${clientId}`, etc.) so GDPR/DPDP account deletion cascades cleanly.
 */
export function purgeAgeAssuranceRecordsForSubjects(subjectSeeds: string[]): number {
  const targetHashes = new Set(
    subjectSeeds
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .map((s) => derivePrivacySessionHash(s))
  );
  if (targetHashes.size === 0) return 0;

  const existing = loadAgeRecords();
  const filtered = existing.filter((r) => !targetHashes.has(r.subjectHash));
  const removedCount = existing.length - filtered.length;
  if (removedCount > 0) {
    saveAgeRecords(filtered);
  }
  return removedCount;
}

export function getLatestRecordForSubjectHash(
  subjectHash: string
): AgeAssuranceConsentRecord | null {
  const records = loadAgeRecords();
  return records.find((r) => r.subjectHash === subjectHash) || null;
}

/**
 * Computes exact UTC age in completed calendar years from an ISO YYYY-MM-DD date string
 * and applies jurisdiction-specific digital consent thresholds.
 */
export function evaluateDateOfBirth(
  dobIso: string,
  referenceDate: Date = new Date(),
  jurisdictionInput: string = 'GLOBAL'
): AgeEvaluationResult {
  const rule = resolveJurisdictionRule(jurisdictionInput);

  if (typeof dobIso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dobIso.trim())) {
    return {
      valid: false,
      error: 'Date of birth must be formatted strictly as YYYY-MM-DD.',
      jurisdiction: rule.code,
      digitalConsentAge: rule.digitalConsentAge,
      belowDigitalConsentThreshold: true,
      applicableStatutes: rule.applicableStatutes,
      legalBasisNote: rule.parentalConsentRuleSummary,
      activePolicyDecision: 'DENY_UNDER_18_ACTIVE_POLICY',
      option2PreparatoryDecision: 'BLOCKED_UNDER_13',
      parentalVerificationRequired: true,
      parentalVerificationStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
    };
  }

  const [yStr, mStr, dStr] = dobIso.trim().split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const day = parseInt(dStr, 10);

  const dobDate = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(dobDate.getTime()) ||
    dobDate.getUTCFullYear() !== year ||
    dobDate.getUTCMonth() !== month - 1 ||
    dobDate.getUTCDate() !== day
  ) {
    return {
      valid: false,
      error: 'Invalid calendar date of birth.',
      jurisdiction: rule.code,
      digitalConsentAge: rule.digitalConsentAge,
      belowDigitalConsentThreshold: true,
      applicableStatutes: rule.applicableStatutes,
      legalBasisNote: rule.parentalConsentRuleSummary,
      activePolicyDecision: 'DENY_UNDER_18_ACTIVE_POLICY',
      option2PreparatoryDecision: 'BLOCKED_UNDER_13',
      parentalVerificationRequired: true,
      parentalVerificationStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
    };
  }

  if (dobDate.getTime() > referenceDate.getTime()) {
    return {
      valid: false,
      error: 'Date of birth cannot be in the future.',
      jurisdiction: rule.code,
      digitalConsentAge: rule.digitalConsentAge,
      belowDigitalConsentThreshold: true,
      applicableStatutes: rule.applicableStatutes,
      legalBasisNote: rule.parentalConsentRuleSummary,
      activePolicyDecision: 'DENY_UNDER_18_ACTIVE_POLICY',
      option2PreparatoryDecision: 'BLOCKED_UNDER_13',
      parentalVerificationRequired: true,
      parentalVerificationStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
    };
  }

  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth() + 1;
  const refDay = referenceDate.getUTCDate();

  let age = refYear - year;
  if (refMonth < month || (refMonth === month && refDay < day)) {
    age -= 1;
  }

  if (age < 0 || age > 130) {
    return {
      valid: false,
      error: 'Date of birth is outside acceptable biological bounds.',
      jurisdiction: rule.code,
      digitalConsentAge: rule.digitalConsentAge,
      belowDigitalConsentThreshold: true,
      applicableStatutes: rule.applicableStatutes,
      legalBasisNote: rule.parentalConsentRuleSummary,
      activePolicyDecision: 'DENY_UNDER_18_ACTIVE_POLICY',
      option2PreparatoryDecision: 'BLOCKED_UNDER_13',
      parentalVerificationRequired: true,
      parentalVerificationStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
    };
  }

  let bracket: AgeBracket;
  let option2Decision: AgeEvaluationResult['option2PreparatoryDecision'];
  if (age < 13) {
    bracket = 'UNDER_13_BLOCKED';
    option2Decision = 'BLOCKED_UNDER_13';
  } else if (age < 18) {
    bracket = 'TEEN_13_17_PENDING_PARENTAL_CONSENT';
    option2Decision = 'REQUIRES_VERIFIABLE_PARENTAL_CONSENT';
  } else {
    bracket = 'ADULT_18_PLUS';
    option2Decision = 'ELIGIBLE_ADULT';
  }

  const belowJurisdictionThreshold = age < rule.digitalConsentAge;
  // Require verifiable parental consent if below jurisdictional consent threshold (e.g. <13 US, <16 EU/DE, <18 IN)
  // OR if teen 13-17 while active/preparatory guardian policies apply.
  const parentalVerificationRequired =
    age < 18 && (belowJurisdictionThreshold || (age >= 13 && age < 18));

  return {
    valid: true,
    ageYears: age,
    bracket,
    jurisdiction: rule.code,
    digitalConsentAge: rule.digitalConsentAge,
    belowDigitalConsentThreshold: belowJurisdictionThreshold,
    applicableStatutes: rule.applicableStatutes,
    legalBasisNote: rule.parentalConsentRuleSummary,
    activePolicyDecision:
      age >= 18 ? 'ALLOW_ADULT_18_PLUS' : 'DENY_UNDER_18_ACTIVE_POLICY',
    option2PreparatoryDecision: option2Decision,
    parentalVerificationRequired,
    parentalVerificationStatus:
      age >= 18 ? 'NOT_REQUIRED' : 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
  };
}

/**
 * Evaluates feature restrictions under Option 4 age-appropriate safeguards and dormant Option 2 rules.
 * Preserves backward compatibility with existing calls while enforcing the full FeatureAccessKey matrix.
 */
export function evaluateMinorFeatureAccess(
  bracket: AgeBracket,
  feature: FeatureAccessKey,
  parentalConsentVerified: boolean,
  options?: { allowOption4Simulation?: boolean }
): {
  allowed: boolean;
  reason: string;
  code: string;
  tierApplied: MinorProtectionTier;
  requiresMinorSafeSafetySettings: boolean;
} {
  const allowSimulation = Boolean(options?.allowOption4Simulation);

  if (bracket === 'ADULT_18_PLUS') {
    return {
      allowed: true,
      reason: 'Permitted under active adult policy.',
      code: 'ALLOWED_ADULT',
      tierApplied: 'ADULT_STANDARD',
      requiresMinorSafeSafetySettings: false,
    };
  }

  if (bracket === 'UNDER_13_BLOCKED') {
    return {
      allowed: false,
      reason: 'Users under 13 are ineligible to register or use any workspace capability.',
      code: 'UNDER_13_BLOCKED',
      tierApplied: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  if (!OPTION_2_ACTIVE && !allowSimulation) {
    return {
      allowed: false,
      reason: 'Active platform policy requires users to be at least 18 years old.',
      code: 'AGE_REQUIREMENT_18_PLUS_NOT_MET',
      tierApplied: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  if (!parentalConsentVerified) {
    return {
      allowed: false,
      reason: 'Verified parental consent is required prior to granting teen workspace access.',
      code: 'PARENTAL_CONSENT_REQUIRED',
      tierApplied: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  const rule = AGE_FEATURE_POLICY_MATRIX[feature];
  if (!rule || !rule.allowedForMinorSafeVerified) {
    return {
      allowed: false,
      reason: `Feature "${feature}" is disabled under Option 4 under-18 minor protection safeguards.`,
      code: 'FEATURE_RESTRICTED_FOR_MINOR',
      tierApplied: 'RESTRICTED_MINOR_SAFE',
      requiresMinorSafeSafetySettings: true,
    };
  }

  return {
    allowed: true,
    reason: `Feature "${feature}" permitted only under Option 4 MINOR_SAFE_RESTRICTED safeguards.`,
    code: 'ALLOWED_MINOR_SAFE_RESTRICTED',
    tierApplied: 'RESTRICTED_MINOR_SAFE',
    requiresMinorSafeSafetySettings: true,
  };
}

export interface RequestAgePolicyContext {
  identified: boolean;
  subjectSeed?: string;
  subjectHash?: string;
  record: AgeAssuranceConsentRecord | null;
  tier: MinorProtectionTier;
  isMinorBlocked: boolean;
  requiresMinorSafeDirectives: boolean;
  reason?: string;
}

/**
 * Resolves the server-side persisted age-assurance state for an incoming HTTP request.
 * Checks verified Firebase UID first (`uid:<uid>`), then `X-Vizra-Client-Id` (`client:<id>`).
 * NEVER trusts client headers to self-declare or upgrade to adult access when a minor record exists.
 */
export async function resolveRequestAgePolicyContext(
  req: express.Request
): Promise<RequestAgePolicyContext> {
  let subjectSeed: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = await verifyFirebaseIdToken(token);
    if (verified.valid && verified.uid) {
      subjectSeed = `uid:${verified.uid}`;
    }
  }

  if (!subjectSeed) {
    const clientTenantHeader = req.headers['x-vizra-client-id'];
    if (
      typeof clientTenantHeader === 'string' &&
      /^[a-zA-Z0-9_-]{4,64}$/.test(clientTenantHeader.trim())
    ) {
      subjectSeed = `client:${clientTenantHeader.trim()}`;
    }
  }

  if (!subjectSeed) {
    return {
      identified: false,
      record: null,
      tier: 'ADULT_STANDARD',
      isMinorBlocked: false,
      requiresMinorSafeDirectives: false,
    };
  }

  const subjectHash = derivePrivacySessionHash(subjectSeed);
  const record = getLatestRecordForSubjectHash(subjectHash);

  if (!record) {
    return {
      identified: true,
      subjectSeed,
      subjectHash,
      record: null,
      tier: 'ADULT_STANDARD',
      isMinorBlocked: false,
      requiresMinorSafeDirectives: false,
    };
  }

  if (record.consentStatus === 'WITHDRAWN' || record.consentStatus === 'REVOKED') {
    return {
      identified: true,
      subjectSeed,
      subjectHash,
      record,
      tier: 'BLOCKED',
      isMinorBlocked: true,
      requiresMinorSafeDirectives: true,
      reason: 'Parental or user consent has been withdrawn/revoked; minor workspace access is disabled.',
    };
  }

  if (record.bracket !== 'ADULT_18_PLUS') {
    const tier: MinorProtectionTier =
      record.minorProtectionTier === 'RESTRICTED_MINOR_SAFE' &&
      OPTION_2_ACTIVE &&
      record.parentalConsentVerified
        ? 'RESTRICTED_MINOR_SAFE'
        : 'BLOCKED';

    return {
      identified: true,
      subjectSeed,
      subjectHash,
      record,
      tier,
      isMinorBlocked: tier === 'BLOCKED',
      requiresMinorSafeDirectives: true,
      reason:
        tier === 'BLOCKED'
          ? 'Access restricted: active 18+ policy or pending/unverified parental consent.'
          : 'Minor-safe restricted protections active.',
    };
  }

  return {
    identified: true,
    subjectSeed,
    subjectHash,
    record,
    tier: 'ADULT_STANDARD',
    isMinorBlocked: false,
    requiresMinorSafeDirectives: false,
  };
}

/**
 * Live Option 4 feature-gate helper for Express API endpoints.
 * Enforces both STRICT_18_PLUS lock and Option 4 age-appropriate feature restrictions server-side.
 */
export async function enforceFeatureAccessForRequest(
  req: express.Request,
  feature: FeatureAccessKey
): Promise<{
  allowed: boolean;
  status: number;
  code?: string;
  message?: string;
  context: RequestAgePolicyContext;
}> {
  const ctx = await resolveRequestAgePolicyContext(req);
  if (!ctx.record || ctx.record.bracket === 'ADULT_18_PLUS') {
    return { allowed: true, status: 200, context: ctx };
  }

  const decision = evaluateMinorFeatureAccess(
    ctx.record.bracket,
    feature,
    ctx.record.parentalConsentVerified &&
      ctx.record.consentStatus === 'VERIFIED'
  );

  if (!decision.allowed) {
    return {
      allowed: false,
      status: 403,
      code: decision.code,
      message: decision.reason,
      context: ctx,
    };
  }

  return { allowed: true, status: 200, context: ctx };
}

async function resolveBoundSubjectSeed(
  req: express.Request,
  explicitSessionIdentifier?: unknown
): Promise<{ seed: string; authenticated: boolean }> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const verified = await verifyFirebaseIdToken(authHeader.slice(7).trim());
    if (verified.valid && verified.uid) {
      return { seed: `uid:${verified.uid}`, authenticated: true };
    }
  }
  const clientTenantHeader = req.headers['x-vizra-client-id'];
  if (
    typeof clientTenantHeader === 'string' &&
    /^[a-zA-Z0-9_-]{4,64}$/.test(clientTenantHeader.trim())
  ) {
    return { seed: `client:${clientTenantHeader.trim()}`, authenticated: false };
  }
  if (typeof explicitSessionIdentifier === 'string' && explicitSessionIdentifier.trim()) {
    return { seed: explicitSessionIdentifier.trim(), authenticated: false };
  }
  return { seed: `dob:${req.ip || 'local'}`, authenticated: false };
}

export function setupAgeAssuranceRoutes(app: express.Application): void {
  const parentalProvider: ParentalVerificationProvider =
    new UnconfiguredParentalVerificationProvider();

  app.get('/api/compliance/age-assurance/policy', generalApiRateLimiter.getMiddleware(), (_req, res) => {
    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      minimumActiveAge: 18,
      option2Preparatory: {
        active: OPTION_2_ACTIVE,
        status: 'DORMANT_PREPARATORY_ONLY',
        parentalVerificationProvider: parentalProvider.providerName,
        parentalVendorConfigured: parentalProvider.configured,
      },
      option3ParentalConsent: {
        status: 'IMPLEMENTED_WITH_EXTERNAL_VENDOR_BLOCKERS',
        jurisdictionsSupported: Object.keys(JURISDICTION_CONSENT_THRESHOLDS),
        parentalVendorConfigured: parentalProvider.configured,
        failClosed: true,
        supportsConsentWithdrawalAndCascadeErasure: true,
        externalBlockers: [
          'Accredited external Verifiable Parental Consent provider (Yoti / KWS / PRIVO) credentials & signed webhook secret not configured.',
          'Formal legal counsel sign-off required per jurisdiction before activating Option 2/3 onboarding.',
        ],
      },
      option4FeatureRestrictions: {
        status: 'IMPLEMENTED_SERVER_ENFORCED',
        minorSafeProfile: 'RESTRICTED_MINOR_SAFE',
        geminiSafetyThreshold: 'BLOCK_LOW_AND_ABOVE',
        enforcedEndpoints: [
          'POST /api/chat',
          'POST /api/research',
          'POST /api/science/query',
          'POST /api/music/generate',
          'POST /api/live/session',
          'GET /api/integrations/:provider/auth-url',
          'POST /api/credits/usage',
          'GET/POST /api/engage/select',
        ],
      },
      option3And4: {
        status: 'IMPLEMENTED_WITH_EXTERNAL_VENDOR_BLOCKERS',
        option3: 'PARTIALLY_IMPLEMENTED_EXTERNAL_VENDOR_REQUIRED',
        option4: 'SERVER_ENFORCED_IN_ACTIVE_AND_PREPARATORY_TIERS',
      },
      option5: {
        rejected: OPTION_5_REJECTED,
        status: 'REJECTED_BY_PROJECT_OWNER',
      },
    });
  });

  app.get('/api/compliance/age-assurance/jurisdictions', generalApiRateLimiter.getMiddleware(), (_req, res) => {
    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      option2Active: OPTION_2_ACTIVE,
      jurisdictions: Object.values(JURISDICTION_CONSENT_THRESHOLDS),
    });
  });

  app.get('/api/compliance/age-assurance/feature-matrix', generalApiRateLimiter.getMiddleware(), (_req, res) => {
    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      option2Active: OPTION_2_ACTIVE,
      option5Rejected: OPTION_5_REJECTED,
      featureMatrix: AGE_FEATURE_POLICY_MATRIX,
    });
  });

  app.post('/api/compliance/age-assurance/evaluate-feature', generalApiRateLimiter.getMiddleware(), (req, res) => {
    const { bracket, feature, parentalConsentVerified = false } = req.body || {};
    if (
      bracket !== 'UNDER_13_BLOCKED' &&
      bracket !== 'TEEN_13_17_PENDING_PARENTAL_CONSENT' &&
      bracket !== 'ADULT_18_PLUS'
    ) {
      res.status(400).json({
        error: {
          code: 'INVALID_AGE_BRACKET',
          message: 'Valid AgeBracket is required.',
        },
      });
      return;
    }

    if (!feature || !Object.prototype.hasOwnProperty.call(AGE_FEATURE_POLICY_MATRIX, feature)) {
      res.status(400).json({
        error: {
          code: 'INVALID_FEATURE_KEY',
          message: 'Unknown feature key.',
        },
      });
      return;
    }

    const activeDecision = evaluateMinorFeatureAccess(
      bracket,
      feature as FeatureAccessKey,
      Boolean(parentalConsentVerified),
      { allowOption4Simulation: false }
    );
    const preparatoryOption4Decision = evaluateMinorFeatureAccess(
      bracket,
      feature as FeatureAccessKey,
      Boolean(parentalConsentVerified),
      { allowOption4Simulation: true }
    );

    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      option2Active: OPTION_2_ACTIVE,
      activeDecision,
      preparatoryOption4Decision,
    });
  });

  app.get('/api/compliance/age-assurance/status', generalApiRateLimiter.getMiddleware(), async (req, res) => {
    const ctx = await resolveRequestAgePolicyContext(req);
    if (!ctx.identified) {
      res.status(401).json({
        error: {
          code: 'SUBJECT_IDENTIFICATION_REQUIRED',
          message: 'Authenticated Bearer token or X-Vizra-Client-Id header required to query session age-assurance status.',
        },
      });
      return;
    }
    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      option2Active: OPTION_2_ACTIVE,
      tier: ctx.tier,
      isMinorBlocked: ctx.isMinorBlocked,
      requiresMinorSafeDirectives: ctx.requiresMinorSafeDirectives,
      record: ctx.record
        ? {
            recordId: ctx.record.recordId,
            bracket: ctx.record.bracket,
            jurisdiction: ctx.record.jurisdiction,
            digitalConsentAge: ctx.record.digitalConsentAge,
            consentStatus: ctx.record.consentStatus,
            minorProtectionTier: ctx.record.minorProtectionTier,
            parentalConsentVerified: ctx.record.parentalConsentVerified,
            recordedAt: ctx.record.recordedAt,
            updatedAt: ctx.record.updatedAt,
            withdrawnAt: ctx.record.withdrawnAt,
          }
        : null,
    });
  });

  app.post('/api/compliance/age-assurance/evaluate', generalApiRateLimiter.getMiddleware(), async (req, res) => {
    const { dateOfBirth, jurisdiction = 'GLOBAL', sessionIdentifier } = req.body || {};
    const evaluation = evaluateDateOfBirth(dateOfBirth, new Date(), jurisdiction);

    if (!evaluation.valid) {
      res.status(400).json({
        error: {
          code: 'INVALID_DATE_OF_BIRTH',
          message: evaluation.error,
        },
      });
      return;
    }

    const boundSubject = await resolveBoundSubjectSeed(req, sessionIdentifier);
    const subjectHash = derivePrivacySessionHash(boundSubject.seed);
    const hasExplicitIdentity =
      boundSubject.authenticated ||
      (typeof req.headers['x-vizra-client-id'] === 'string' &&
        req.headers['x-vizra-client-id'].trim().length >= 4) ||
      (typeof sessionIdentifier === 'string' && sessionIdentifier.trim().length > 0);

    // Anti-circumvention guard for named/authenticated subjects: once evaluated under-18,
    // prevent instant "self-aging up" on a subsequent request to bypass minor protection.
    if (hasExplicitIdentity) {
      const priorRecord = getLatestRecordForSubjectHash(subjectHash);
      if (
        priorRecord &&
        priorRecord.bracket !== 'ADULT_18_PLUS' &&
        priorRecord.consentStatus !== 'WITHDRAWN' &&
        evaluation.bracket === 'ADULT_18_PLUS'
      ) {
        res.status(403).json({
          allowed: false,
          error: {
            code: 'SELF_DECLARATION_CIRCUMVENTION_BLOCKED',
            message:
              'Previous evaluation indicated an under-18 session. Self-declared age cannot be revised upward to bypass minor safeguards.',
          },
        });
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const consentStatus: ConsentLifecycleStatus =
      evaluation.bracket === 'ADULT_18_PLUS'
        ? 'NOT_REQUIRED'
        : evaluation.bracket === 'UNDER_13_BLOCKED'
        ? 'BLOCKED_BY_EXTERNAL_DEPENDENCY'
        : 'PENDING_VENDOR_VERIFICATION';

    // Record only non-PII bracket + salted hash + threshold metadata (zero raw DOB persisted)
    const record: AgeAssuranceConsentRecord = {
      recordId: `age_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`,
      subjectHash,
      bracket: evaluation.bracket!,
      jurisdiction: evaluation.jurisdiction,
      digitalConsentAge: evaluation.digitalConsentAge,
      applicableStatutes: evaluation.applicableStatutes,
      activePolicy: ACTIVE_AGE_POLICY,
      option2ActiveAtEvaluation: OPTION_2_ACTIVE,
      parentalConsentVerified: false,
      consentStatus,
      minorProtectionTier: evaluation.bracket === 'ADULT_18_PLUS' ? 'ADULT_STANDARD' : 'BLOCKED',
      recordedAt: nowIso,
      updatedAt: nowIso,
    };
    upsertAgeRecord(record);

    if (evaluation.activePolicyDecision !== 'ALLOW_ADULT_18_PLUS') {
      res.status(403).json({
        allowed: false,
        activePolicy: ACTIVE_AGE_POLICY,
        option2Active: OPTION_2_ACTIVE,
        evaluation: {
          bracket: evaluation.bracket,
          jurisdiction: evaluation.jurisdiction,
          digitalConsentAge: evaluation.digitalConsentAge,
          belowDigitalConsentThreshold: evaluation.belowDigitalConsentThreshold,
          applicableStatutes: evaluation.applicableStatutes,
          legalBasisNote: evaluation.legalBasisNote,
          activePolicyDecision: evaluation.activePolicyDecision,
          option2PreparatoryDecision: evaluation.option2PreparatoryDecision,
          parentalVerificationRequired: evaluation.parentalVerificationRequired,
          parentalVerificationStatus: evaluation.parentalVerificationStatus,
        },
        recordId: record.recordId,
        error: {
          code: 'AGE_REQUIREMENT_18_PLUS_NOT_MET',
          message:
            'VIZRA currently requires users to be 18+ years old. Minor onboarding & Option 3 verifiable parental consent remain blocked pending external provider and counsel sign-off.',
        },
      });
      return;
    }

    res.json({
      allowed: true,
      activePolicy: ACTIVE_AGE_POLICY,
      option2Active: OPTION_2_ACTIVE,
      evaluation: {
        bracket: evaluation.bracket,
        jurisdiction: evaluation.jurisdiction,
        digitalConsentAge: evaluation.digitalConsentAge,
        belowDigitalConsentThreshold: evaluation.belowDigitalConsentThreshold,
        applicableStatutes: evaluation.applicableStatutes,
        legalBasisNote: evaluation.legalBasisNote,
        activePolicyDecision: evaluation.activePolicyDecision,
        option2PreparatoryDecision: evaluation.option2PreparatoryDecision,
        parentalVerificationRequired: evaluation.parentalVerificationRequired,
        parentalVerificationStatus: evaluation.parentalVerificationStatus,
      },
      recordId: record.recordId,
    });
  });

  app.post(
    '/api/compliance/age-assurance/parental-consent',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const {
        parentEmail,
        jurisdiction = 'GLOBAL',
        sessionIdentifier,
        verified,
        bypass,
        autoApprove,
      } = req.body || {};

      // Reject any client attempt to self-approve or spoof parental consent
      if (verified === true || bypass === true || autoApprove === true) {
        res.status(403).json({
          verified: false,
          error: {
            code: 'SPOOFED_VERIFICATION_REJECTED',
            message:
              'Client-supplied verification overrides are forbidden. Parental consent requires signed external provider verification.',
          },
        });
        return;
      }

      if (typeof parentEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
        res.status(400).json({
          error: {
            code: 'INVALID_PARENT_EMAIL',
            message: 'A valid guardian email address is required for verification initiation.',
          },
        });
        return;
      }

      const rule = resolveJurisdictionRule(jurisdiction);
      const boundSubject = await resolveBoundSubjectSeed(req, sessionIdentifier || 'anon');
      const subjectSessionHash = derivePrivacySessionHash(boundSubject.seed);
      const parentEmailHash = derivePrivacySessionHash(parentEmail.trim().toLowerCase());

      const outcome = await parentalProvider.initiateVerification({
        parentEmailHash,
        jurisdiction: rule.code,
        subjectSessionHash,
      });

      const nowIso = new Date().toISOString();
      const recordId = `vpc_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`;
      upsertAgeRecord({
        recordId,
        subjectHash: subjectSessionHash,
        parentEmailHash,
        bracket: 'TEEN_13_17_PENDING_PARENTAL_CONSENT',
        jurisdiction: rule.code,
        digitalConsentAge: rule.digitalConsentAge,
        applicableStatutes: rule.applicableStatutes,
        activePolicy: ACTIVE_AGE_POLICY,
        option2ActiveAtEvaluation: OPTION_2_ACTIVE,
        parentalConsentVerified: false,
        consentStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
        minorProtectionTier: 'BLOCKED',
        recordedAt: nowIso,
        updatedAt: nowIso,
      });

      if (!outcome.verified) {
        res.status(424).json({
          verified: false,
          recordId,
          jurisdiction: rule.code,
          digitalConsentAge: rule.digitalConsentAge,
          status: outcome.status,
          error: {
            code: outcome.code,
            message: outcome.message,
          },
        });
        return;
      }

      res.json({ ...outcome, recordId });
    }
  );

  // Fail-closed webhook callback endpoint for future accredited Verifiable Parental Consent vendor
  app.post(
    '/api/compliance/age-assurance/parental-consent/callback',
    generalApiRateLimiter.getMiddleware(),
    (req, res) => {
      const webhookSecret = process.env.PARENTAL_CONSENT_WEBHOOK_SECRET;
      if (!webhookSecret || webhookSecret.trim().length < 16) {
        res.status(424).json({
          error: {
            code: 'PARENTAL_VERIFICATION_VENDOR_NOT_CONFIGURED',
            message:
              'External parental verification webhook secret is not configured. Signed callbacks remain disabled.',
          },
        });
        return;
      }

      const providedSig = String(req.headers['x-parental-signature'] || '').trim();
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body || {}))
        .digest('hex');

      if (!providedSig || !safeCompare(providedSig, expectedSig)) {
        res.status(401).json({
          error: {
            code: 'INVALID_WEBHOOK_SIGNATURE',
            message: 'Missing or invalid external provider HMAC signature.',
          },
        });
        return;
      }

      res.status(424).json({
        error: {
          code: 'OPTION_2_DORMANT_LEGAL_SIGN_OFF_REQUIRED',
          message: 'Signature verified, but Option 2 minor onboarding remains dormant pending counsel authorization.',
        },
      });
    }
  );

  // Guardian or Account Holder Parental Consent Withdrawal & Revocation Workflow (Option 3)
  app.post(
    '/api/compliance/age-assurance/parental-consent/withdraw',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const { sessionIdentifier, parentEmail } = req.body || {};
      const boundSubject = await resolveBoundSubjectSeed(req, sessionIdentifier);
      const hasBoundIdentity =
        boundSubject.authenticated ||
        (typeof req.headers['x-vizra-client-id'] === 'string' &&
          req.headers['x-vizra-client-id'].trim().length >= 4) ||
        (typeof sessionIdentifier === 'string' && sessionIdentifier.trim().length > 0);

      if (!hasBoundIdentity) {
        res.status(401).json({
          error: {
            code: 'SUBJECT_IDENTIFICATION_REQUIRED',
            message:
              'Authentication, X-Vizra-Client-Id, or sessionIdentifier is required to withdraw parental consent.',
          },
        });
        return;
      }

      const subjectHash = derivePrivacySessionHash(boundSubject.seed);
      const providedParentHash =
        typeof parentEmail === 'string' && parentEmail.includes('@')
          ? derivePrivacySessionHash(parentEmail.trim().toLowerCase())
          : null;

      const records = loadAgeRecords();
      const subjectRecords = records.filter((rec) => rec.subjectHash === subjectHash);
      const registeredParentHashes = subjectRecords
        .map((rec) => rec.parentEmailHash)
        .filter((h): h is string => typeof h === 'string' && h.length > 0);

      if (!boundSubject.authenticated) {
        if (registeredParentHashes.length > 0) {
          const matchesRegisteredParent =
            providedParentHash !== null &&
            registeredParentHashes.some((h) => safeCompare(h, providedParentHash));
          if (!matchesRegisteredParent) {
            res.status(404).json({
              error: {
                code: 'CONSENT_RECORD_NOT_FOUND_OR_UNAUTHORIZED',
                message:
                  'No matching consent record found for this subject, or guardian email confirmation did not match.',
              },
            });
            return;
          }
        } else if (providedParentHash !== null) {
          res.status(404).json({
            error: {
              code: 'CONSENT_RECORD_NOT_FOUND_OR_UNAUTHORIZED',
              message:
                'No matching guardian verification record found for the supplied guardian email.',
            },
          });
          return;
        }
      }

      let updatedCount = 0;
      const nowIso = new Date().toISOString();

      const updated = records.map((rec) => {
        if (rec.subjectHash !== subjectHash) return rec;
        updatedCount += 1;
        return {
          ...rec,
          parentalConsentVerified: false,
          consentStatus: 'WITHDRAWN' as ConsentLifecycleStatus,
          minorProtectionTier: 'BLOCKED' as MinorProtectionTier,
          updatedAt: nowIso,
          withdrawnAt: nowIso,
        };
      });

      if (updatedCount === 0) {
        res.status(404).json({
          error: {
            code: 'CONSENT_RECORD_NOT_FOUND_OR_UNAUTHORIZED',
            message:
              'No matching consent record found for this subject, or guardian email confirmation did not match.',
          },
        });
        return;
      }

      saveAgeRecords(updated);
      res.json({
        success: true,
        withdrawnRecords: updatedCount,
        consentStatus: 'WITHDRAWN',
        minorProtectionTier: 'BLOCKED',
        withdrawnAt: nowIso,
      });
    }
  );

  // Explicit guard proving Option 5 (unrestricted minor access / passive terms) stays rejected
  app.post('/api/compliance/age-assurance/option-5-bypass', (_req, res) => {
    res.status(403).json({
      rejected: OPTION_5_REJECTED,
      error: {
        code: 'POLICY_OPTION_5_REJECTED',
        message: 'Option 5 (Unrestricted Access / Passive Terms Only) is permanently rejected by the Project Owner.',
      },
    });
  });
}
