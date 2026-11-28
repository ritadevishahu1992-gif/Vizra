import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import {
  generalApiRateLimiter,
  derivePrivacySessionHash,
  derivePrivacySessionHashCandidates,
  safeCompare,
} from '../security';
import { verifyFirebaseIdToken } from '../authVerification';
import { getParentalConsentConfig } from '../config/envConfig';
import {
  APPROVED_YOUTH_CONSENT_SCOPES,
  AccountAccessState,
  CONSENT_POLICY_VERSION,
  ConsentScope,
  appendConsentAuditLog,
  createOrReuseParentalInvitation,
  finalizeVerifiedParentalConsent,
  getConsentPersistenceStatus,
  getInvitationByRawToken,
  getLatestParentalConsentForChild,
  listParentalConsentsForActor,
  purgeParentalConsentDataForUid,
  recordParentApprovalAttempt,
  revokeParentalConsent,
} from './parentalConsentStore';

/**
 * VIZRA AGE ASSURANCE & PARENTAL CONSENT FRAMEWORK
 *
 * Replaces the universal STRICT_18_PLUS gate with a dual-environment architecture:
 * - OMNIA ADULT (`ADULT_ACCESS`): Eligible users aged 18+.
 * - OMNIA YOUTH (`MINOR_RESTRICTED_ACCESS` / `PARENTAL_CONSENT_VERIFIED`): Eligible users under 18
 *   subject to applicable law, independently verified parental consent, and mandatory age-appropriate safeguards.
 *
 * Core Governance Rules:
 * - Age declaration is an initial routing signal only, never certified proof of adulthood.
 * - Zero behavioural age inference and zero persistent behavioural profiling of minors.
 * - Parental consent can NEVER override mandatory legal/safety restrictions (Live Voice,
 *   unrestricted audio synthesis, paid commercial upgrades, external connectors, targeted ads remain disabled).
 * - External identity/authority verification fails closed unless a real verification provider is configured.
 * - Option 5 (unrestricted passive access) remains permanently rejected.
 */
export const ACTIVE_AGE_POLICY = 'VIZRA_AGE_ASSURANCE_PARENTAL_CONSENT' as const;
export const LEGACY_SUPERSEDED_POLICY = 'STRICT_18_PLUS' as const;
export const OMNIA_YOUTH_ENABLED = true;
export const OPTION_2_ACTIVE = true;
export const OPTION_5_REJECTED = true;
export const BEHAVIOURAL_AGE_INFERENCE_ENABLED = false;
export const MINOR_BEHAVIOURAL_PROFILING_ENABLED = false;

export type OmniaAccessEnvironment = 'OMNIA_ADULT' | 'OMNIA_YOUTH' | 'BLOCKED';

export type AgeStatus = 'ADULT_18_PLUS' | 'MINOR_13_17' | 'UNDER_13' | 'UNDECLARED';

export type AgeBracket =
  | 'UNDER_13_BLOCKED'
  | 'TEEN_13_17_PENDING_PARENTAL_CONSENT'
  | 'ADULT_18_PLUS';

export type ConsentLifecycleStatus =
  | 'NOT_REQUIRED'
  | 'PARENTAL_CONSENT_PENDING'
  | 'PENDING_VENDOR_VERIFICATION'
  | 'BLOCKED_BY_EXTERNAL_DEPENDENCY'
  | 'PARENTAL_CONSENT_VERIFIED'
  | 'VERIFIED'
  | 'PARENTAL_CONSENT_REVOKED'
  | 'WITHDRAWN'
  | 'REVOKED'
  | 'EXPIRED'
  | 'DENIED';

export type MinorProtectionTier =
  | 'ADULT_STANDARD'
  | 'RESTRICTED_MINOR_SAFE'
  | 'BLOCKED';

export type FeatureAccessKey =
  | 'chat_basic'
  | 'educational_assistance'
  | 'coding_assistance_youth'
  | 'web_research_safe'
  | 'restricted_file_analysis'
  | 'science_educational'
  | 'rag_local_restricted'
  | 'voice_live'
  | 'unrestricted_creative_studio'
  | 'third_party_workspace_oauth'
  | 'paid_billing'
  | 'commercial_engage_targeting';

export interface ResourceBoundaryPolicy {
  maxPromptChars: number;
  maxAttachments: number;
  maxDecodedAttachmentBytes: number;
  allowAudioAttachments: boolean;
  maxLocalRagBytes: number;
}

export const ADULT_RESOURCE_LIMITS: ResourceBoundaryPolicy = {
  maxPromptChars: 50_000,
  maxAttachments: 5,
  maxDecodedAttachmentBytes: 10 * 1024 * 1024,
  allowAudioAttachments: true,
  maxLocalRagBytes: 25 * 1024 * 1024,
};

export const YOUTH_RESOURCE_LIMITS: ResourceBoundaryPolicy = {
  maxPromptChars: 25_000,
  maxAttachments: 2,
  maxDecodedAttachmentBytes: 5 * 1024 * 1024,
  allowAudioAttachments: false,
  maxLocalRagBytes: 25 * 1024 * 1024,
};

export interface JurisdictionConsentRule {
  code: string;
  label: string;
  digitalConsentAge: number;
  adultMajorityAge: number;
  applicableStatutes: string[];
  parentalConsentRuleSummary: string;
  verificationStandardNote: string;
  counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF';
}

/**
 * International statutory digital consent age reference table.
 * Explicitly differentiates India DPDP Act & DPDP Rules, US COPPA, EU GDPR Art. 8 member states,
 * UK AADC, and conservative global baseline — never assuming one global consent workflow suffices.
 */
export const JURISDICTION_CONSENT_THRESHOLDS: Record<string, JurisdictionConsentRule> = {
  IN: {
    code: 'IN',
    label: 'India (DPDP Act 2023 & DPDP Rules)',
    digitalConsentAge: 18,
    adultMajorityAge: 18,
    applicableStatutes: [
      'India Digital Personal Data Protection Act, 2023 (Section 2(f) & Section 9)',
      'DPDP Rules (Verifiable Parental Consent & Commencement Provisions)',
    ],
    parentalConsentRuleSummary:
      'Defines any individual under 18 as a child, requires verifiable parental consent via reliable identity/age verification or virtual tokens (e.g., DigiLocker/authorized entity) once commenced, and prohibits tracking, behavioral monitoring, and targeted advertising directed at children.',
    verificationStandardNote:
      'Ordinary email confirmation or unchecked checkboxes are legally insufficient. Requires independent parent identity & guardianship verification via an accredited provider or DPDP-authorized virtual token mechanism.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  US: {
    code: 'US',
    label: 'United States (COPPA & Youth Privacy Protections)',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: [
      'US COPPA (15 U.S.C. §§ 6501–6506; 16 CFR Part 312)',
      'State youth privacy & age-appropriate design protections (CA, etc.)',
    ],
    parentalConsentRuleSummary:
      'Verifiable Parental Consent (VPC) mandatory for personal data collection from children under 13; VIZRA additionally requires verified parental consent and Omnia Youth safeguards for ages 13–17.',
    verificationStandardNote:
      'Under COPPA 16 CFR § 312.5, verifiable parental consent requires an FTC-recognized method (e.g., accredited VPC provider, ID verification with immediate disposal, or knowledge-based/payment verification)—not plain email confirmation.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  EU: {
    code: 'EU',
    label: 'European Union (GDPR Art. 8 & DSA Minor Protections)',
    digitalConsentAge: 16,
    adultMajorityAge: 18,
    applicableStatutes: [
      'EU GDPR Article 8',
      'EU Digital Services Act (DSA) Article 28 (Protection of Minors)',
    ],
    parentalConsentRuleSummary:
      'Default GDPR Art. 8 digital consent age is 16 unless lowered by member-state law (13–16); DSA Art. 28 bans profiling-based advertising to minors and mandates proportionate high-privacy defaults.',
    verificationStandardNote:
      'Requires reasonable, proportionate efforts to verify holder of parental responsibility using available privacy-preserving technology.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  DE: {
    code: 'DE',
    label: 'Germany (EU GDPR Art. 8)',
    digitalConsentAge: 16,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 (Germany 16-year threshold)', 'EU DSA Article 28'],
    parentalConsentRuleSummary:
      'Verifiable holder-of-parental-responsibility consent required under age 16, plus under-18 Omnia Youth safeguards.',
    verificationStandardNote:
      'Proportionate independent verification of parental authority required; zero profiling ads.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  NL: {
    code: 'NL',
    label: 'Netherlands (EU GDPR Art. 8 / UAVG)',
    digitalConsentAge: 16,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & Dutch UAVG Art. 5', 'EU DSA Article 28'],
    parentalConsentRuleSummary:
      'Verifiable parental consent required under age 16, with Omnia Youth safeguards through age 17.',
    verificationStandardNote:
      'Proportionate independent verification of parental responsibility required.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  FR: {
    code: 'FR',
    label: 'France (EU GDPR Art. 8 / Loi Informatique et Libertés)',
    digitalConsentAge: 15,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & French Data Protection Act Art. 45', 'EU DSA Article 28'],
    parentalConsentRuleSummary:
      'Parental authorization required below age 15 (French digital majority), with Omnia Youth safeguards through age 17.',
    verificationStandardNote:
      'Independent guardian authentication & external identity verification required.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  IT: {
    code: 'IT',
    label: 'Italy (EU GDPR Art. 8 / Codice Privacy)',
    digitalConsentAge: 14,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & Italian Legislative Decree 101/2018', 'EU DSA Article 28'],
    parentalConsentRuleSummary:
      'Parental authorization required below age 14, with Omnia Youth safeguards through age 17.',
    verificationStandardNote: 'Proportionate independent verification of parental authority required.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  ES: {
    code: 'ES',
    label: 'Spain (EU GDPR Art. 8 / LOPDGDD)',
    digitalConsentAge: 14,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 & Spanish LOPDGDD Art. 7', 'EU DSA Article 28'],
    parentalConsentRuleSummary:
      'Holder-of-parental-responsibility consent required below age 14, with Omnia Youth safeguards through age 17.',
    verificationStandardNote: 'Proportionate independent verification of parental authority required.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  SE: {
    code: 'SE',
    label: 'Sweden (EU GDPR Art. 8)',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: ['EU GDPR Article 8 (Sweden 13-year threshold)', 'EU DSA Article 28'],
    parentalConsentRuleSummary:
      'Parental consent required below age 13, with Omnia Youth safeguards through age 17.',
    verificationStandardNote: 'Proportionate independent verification of parental authority required.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  UK: {
    code: 'UK',
    label: 'United Kingdom (UK GDPR Art. 8 & Age Appropriate Design Code)',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: [
      'UK GDPR Article 8',
      "UK ICO Age Appropriate Design Code (Children's Code, under 18)",
      'UK Online Safety Act (Age Assurance duties)',
    ],
    parentalConsentRuleSummary:
      'Parental consent below 13 plus mandatory Age Appropriate Design Code high-privacy defaults, zero behavioral profiling, and age-appropriate feature boundaries for all users under 18.',
    verificationStandardNote:
      'Proportionate age assurance and guardian verification without invasive data retention.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  GB: {
    code: 'GB',
    label: 'United Kingdom (GB ISO Code)',
    digitalConsentAge: 13,
    adultMajorityAge: 18,
    applicableStatutes: [
      'UK GDPR Article 8',
      "UK ICO Age Appropriate Design Code (Children's Code, under 18)",
      'UK Online Safety Act (Age Assurance duties)',
    ],
    parentalConsentRuleSummary:
      'Parental consent below 13 plus mandatory Age Appropriate Design Code high-privacy defaults for all users under 18.',
    verificationStandardNote:
      'Proportionate age assurance and guardian verification without invasive data retention.',
    counselReviewStatus: 'STATUTORY_REFERENCE_REQUIRES_COUNSEL_SIGN_OFF',
  },
  GLOBAL: {
    code: 'GLOBAL',
    label: 'Conservative Global Baseline (Under-18 Protected)',
    digitalConsentAge: 18,
    adultMajorityAge: 18,
    applicableStatutes: [
      'Conservative Baseline (India DPDP Sec. 9 / COPPA / EU GDPR Art. 8 & DSA / UK AADC)',
    ],
    parentalConsentRuleSummary:
      'Defaults to the strictest under-18 verifiable parental consent requirement and Omnia Youth safeguards unless overridden by verified jurisdiction rules.',
    verificationStandardNote:
      'Applies strict verifiable guardian identity checks and zero behavioral profiling of minors.',
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
  ageStatus: AgeStatus;
  bracket?: AgeBracket;
  jurisdiction: string;
  digitalConsentAge: number;
  belowDigitalConsentThreshold: boolean;
  applicableStatutes: string[];
  legalBasisNote: string;
  verificationStandardNote: string;
  ageAssuranceMethod: 'SELF_DECLARATION_ROUTING_ONLY';
  recommendedEnvironment: OmniaAccessEnvironment;
  accountAccessState: AccountAccessState;
  activePolicyDecision:
    | 'ALLOW_OMNIA_ADULT'
    | 'ROUTE_OMNIA_YOUTH_PARENTAL_CONSENT'
    | 'DENY_UNDER_13_INELIGIBLE';
  option2PreparatoryDecision:
    | 'BLOCKED_UNDER_13'
    | 'REQUIRES_VERIFIABLE_PARENTAL_CONSENT'
    | 'ELIGIBLE_ADULT';
  parentalVerificationRequired: boolean;
  parentalVerificationStatus:
    | 'NOT_REQUIRED'
    | 'PARENTAL_CONSENT_PENDING'
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
        'External identity & guardianship verification provider (e.g., Yoti, KWS, PRIVO, or India DPDP virtual token verifier) is not configured. Omnia Youth remains fail-closed until verified.',
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
  childUid?: string;
  parentEmailHash?: string;
  ageStatus: AgeStatus;
  bracket: AgeBracket;
  jurisdiction: string;
  digitalConsentAge: number;
  applicableStatutes: string[];
  activePolicy: string;
  accountAccessState: AccountAccessState;
  environment: OmniaAccessEnvironment;
  option2ActiveAtEvaluation: boolean;
  parentalConsentVerified: boolean;
  consentStatus: ConsentLifecycleStatus;
  minorProtectionTier: MinorProtectionTier;
  suspended?: boolean;
  suspensionReason?: string;
  recordedAt: string;
  updatedAt: string;
  withdrawnAt?: string;
}

/**
 * Authoritative server-enforced Omnia Adult vs Omnia Youth Feature Policy Matrix.
 * Parental consent can NEVER override mandatory disabled features for minors.
 */
export const AGE_FEATURE_POLICY_MATRIX: Record<
  FeatureAccessKey,
  {
    label: string;
    endpointOrSubsystem: string;
    allowedForUnder13: false;
    allowedForMinorSafeVerified: boolean;
    allowedForAdult18Plus: true;
    parentalOverridePermitted: boolean;
    safeguardDescription: string;
  }
> = {
  chat_basic: {
    label: 'Omnia Core Conversational AI',
    endpointOrSubsystem: 'POST /api/chat',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Permitted in Omnia Youth with verified parental consent; enforces MINOR_SAFE_GEMINI_SAFETY_SETTINGS (BLOCK_LOW_AND_ABOVE) and MINOR_SAFE_SYSTEM_DIRECTIVE.',
  },
  educational_assistance: {
    label: 'Educational Assistance & Study Support',
    endpointOrSubsystem: 'POST /api/chat (educational modes)',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Approved core capability for Omnia Youth accounts with age-appropriate educational guardrails.',
  },
  coding_assistance_youth: {
    label: 'Age-Appropriate Coding & Shader Assistance',
    endpointOrSubsystem: 'POST /api/chat (code mode)',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Approved educational programming assistance for Omnia Youth; blocks malicious cyber/exploit code.',
  },
  web_research_safe: {
    label: 'Filtered Grounded Web Research',
    endpointOrSubsystem: 'POST /api/research',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Permitted in Omnia Youth with strict BLOCK_LOW_AND_ABOVE safety filtering and verified HTTPS citation hygiene.',
  },
  restricted_file_analysis: {
    label: 'Restricted File Analysis',
    endpointOrSubsystem: 'POST /api/chat (attachments)',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Omnia Youth restricts uploads to max 2 attachments, <= 5 MB total decoded payload, educational document/image formats only, and no raw audio uploads.',
  },
  science_educational: {
    label: 'Science Explorer (AlphaFold / PubChem / PubMed)',
    endpointOrSubsystem: 'POST /api/science/query',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Permitted for educational molecular and biomedical literature lookup under Omnia Youth.',
  },
  rag_local_restricted: {
    label: 'Local RAG Embeddings (25 MB Browser Index)',
    endpointOrSubsystem: 'POST /api/rag/embed & /api/rag/embed/batch',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: true,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Permitted for verified Omnia Youth accounts with prompt-injection screening; blocked when parental consent is pending or revoked.',
  },
  voice_live: {
    label: 'Live Multimodal Voice WebSocket',
    endpointOrSubsystem: 'POST /api/live/session & WS /live',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Strictly disabled for all Omnia Youth / under-18 accounts to prevent unmoderated real-time audio interactions. Parental consent cannot override.',
  },
  unrestricted_creative_studio: {
    label: 'Unrestricted Audio & Lyria Music Synthesis',
    endpointOrSubsystem: 'POST /api/music/generate',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Strictly disabled for Omnia Youth initially. Parental consent cannot override.',
  },
  third_party_workspace_oauth: {
    label: 'External Workspace OAuth Connectors',
    endpointOrSubsystem: 'GET /api/integrations/:provider/auth-url',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Disabled for all Omnia Youth accounts to prevent third-party data sharing and external account linking.',
  },
  paid_billing: {
    label: 'Commercial Plans, Upgrades & Paid Credit Refills',
    endpointOrSubsystem: 'POST /api/credits/usage & POST /api/billing/webhook',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Financial upgrades and commercial credit refills strictly disabled for Omnia Youth / minor accounts.',
  },
  commercial_engage_targeting: {
    label: 'VIZRA Engage Sponsored & Affiliate Placements',
    endpointOrSubsystem: 'GET/POST /api/engage/select',
    allowedForUnder13: false,
    allowedForMinorSafeVerified: false,
    allowedForAdult18Plus: true,
    parentalOverridePermitted: false,
    safeguardDescription:
      'Suppresses all sponsored_card, affiliate_card, behavioral profiling, and targeted advertising for minors (India DPDP Sec. 9, EU DSA Art. 28, UK AADC).',
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

export const MINOR_SAFE_SYSTEM_DIRECTIVE = `[OMNIA YOUTH AGE-APPROPRIATE GUARDRAIL]: You are operating in OMNIA YOUTH mode under VIZRA's mandatory minor-protection framework. Do NOT generate sexually explicit/suggestive content, romantic roleplay, self-harm ideation, dangerous physical challenges, substance-use encouragement, gambling advice, financial solicitation, targeted advertising, or age-inappropriate horror/violence. Do NOT attempt to infer the user's age from writing style or build behavioral profiles. Never bypass age restrictions or parental consent requirements. Maintain a constructive, educational, and supportive tone. Refuse unsafe or age-restricted requests calmly and redirect to safe educational topics.`;

export const PARENTAL_CONSENT_DISCLOSURE_PAYLOAD = {
  policyVersion: CONSENT_POLICY_VERSION,
  environment: 'OMNIA_YOUTH',
  whatOmniaYouthCanDo: [
    'Core conversational AI for learning, writing, and brainstorming under strict safety filtering.',
    'Educational assistance across STEM, humanities, and study planning.',
    'Age-appropriate coding and creative technology guidance.',
    'Filtered grounded web research with verified HTTPS citations.',
    'Restricted file analysis (max 2 attachments, <= 5 MB total, educational text/document/image files only).',
    'Science Explorer access (public AlphaFold DB, PubChem, and PubMed databases).',
  ],
  whatIsRestricted: [
    'Live Multimodal Voice (/live) is strictly disabled.',
    'Unrestricted audio & Lyria music synthesis (/api/music/generate) is disabled.',
    'Paid upgrades, subscriptions, and commercial credit refills are disabled.',
    'External third-party OAuth connectors (Google Drive, Docs, Sheets, GitHub, Figma, Canva, YouTube, Notion, Dropbox) are disabled.',
    'Targeted advertising, sponsored/affiliate Engage cards, and behavioral tracking/profiling are permanently disabled.',
    'Parental consent cannot override mandatory legal or safety restrictions.',
  ],
  dataCollected: [
    'Firebase Authentication account identifier (UID) and email verification state.',
    'Jurisdiction code and age-bracket classification (raw date of birth is never stored).',
    'Parental consent record, parent-child relationship verification reference, policy version, and non-PII consent audit timestamps.',
    'Zero raw identity documents, facial images, biometric templates, passwords, OTPs, or payment details are stored in Firestore.',
  ],
  howDataIsProcessed: [
    'Prompts are processed server-side to generate educational/creative responses with strict BLOCK_LOW_AND_ABOVE safety settings.',
    'No behavioural age inference is performed; no persistent behavioural profiles of minors are built.',
    'Temporary chats are never written to browser localStorage or cloud persistence.',
  ],
  dataRetentionPractices: [
    'Consent records remain active until withdrawn, expired (1-year review cycle), or account deletion.',
    'On consent withdrawal, Omnia Youth access is revoked immediately across all API endpoints.',
    'On account deletion (DELETE /api/account/data), workspace records, age-assurance records, and parental consent records are purged, retaining only a non-personal cryptographic erasure receipt hash for statutory compliance.',
  ],
  parentAndChildPrivacyRights: [
    'Parents/guardians may review consent status, scopes, and audit timestamps at any time via /parental-consent.',
    'Private child conversations are NOT automatically exposed to parents/guardians; any future parental access to child content requires separate legal evaluation and explicit disclosure.',
    'Both parents/guardians and account holders have rights of access, correction, consent withdrawal, and full data erasure under applicable law (India DPDP Act 2023, COPPA, EU GDPR, UK GDPR/AADC).',
  ],
  howToWithdrawConsent: [
    'Sign in to /parental-consent with the verified parent/guardian account and click "Withdraw Consent", or invoke POST /api/compliance/parental-consent/revoke.',
    'Revocation takes effect immediately on the server and invalidates Omnia Youth API access.',
  ],
};

const AGE_RECORDS_PATH = path.resolve(process.cwd(), 'data', 'age_assurance_records.json');
let inMemoryAgeRecords: AgeAssuranceConsentRecord[] | null = null;

function loadAgeRecords(): AgeAssuranceConsentRecord[] {
  if (inMemoryAgeRecords) return inMemoryAgeRecords;
  try {
    if (fs.existsSync(AGE_RECORDS_PATH)) {
      const raw = fs.readFileSync(AGE_RECORDS_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryAgeRecords = Array.isArray(parsed) ? parsed : [];
      return inMemoryAgeRecords;
    }
  } catch {
    // Fallback empty
  }
  inMemoryAgeRecords = [];
  return inMemoryAgeRecords;
}

function saveAgeRecords(records: AgeAssuranceConsentRecord[]): void {
  inMemoryAgeRecords = records.slice(0, 500);
  try {
    const dir = path.dirname(AGE_RECORDS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AGE_RECORDS_PATH, JSON.stringify(inMemoryAgeRecords, null, 2), 'utf-8');
  } catch {
    // Read-only fallback stays in memory
  }
}

function upsertAgeRecord(record: AgeAssuranceConsentRecord): void {
  const existing = loadAgeRecords();
  existing.unshift(record);
  saveAgeRecords(existing);
}

/**
 * Removes all persisted age-assurance and parental-consent records matching any supplied raw subject seeds
 * across active and rotated SESSION_HASH_SECRET_PREVIOUS salts so GDPR/DPDP account deletion cascades cleanly.
 */
export function purgeAgeAssuranceRecordsForSubjects(subjectSeeds: string[]): number {
  const targetHashes = new Set<string>();
  const targetUids = new Set<string>();

  for (const seed of subjectSeeds) {
    if (typeof seed !== 'string' || !seed.trim()) continue;
    const trimmed = seed.trim();
    if (trimmed.startsWith('uid:')) {
      targetUids.add(trimmed.slice(4));
    }
    for (const candidateHash of derivePrivacySessionHashCandidates(trimmed)) {
      targetHashes.add(candidateHash);
    }
  }

  let removedCount = 0;
  if (targetHashes.size > 0) {
    const existing = loadAgeRecords();
    const filtered = existing.filter(
      (r) => !targetHashes.has(r.subjectHash) && (!r.childUid || !targetUids.has(r.childUid))
    );
    removedCount = existing.length - filtered.length;
    if (removedCount > 0) {
      saveAgeRecords(filtered);
    }
  }

  for (const uid of targetUids) {
    const purgedParental = purgeParentalConsentDataForUid(uid);
    removedCount += purgedParental.purgedConsents;
  }

  return removedCount;
}

export function getLatestRecordForSubjectHash(
  subjectHash: string
): AgeAssuranceConsentRecord | null {
  const records = loadAgeRecords();
  return records.find((r) => r.subjectHash === subjectHash) || null;
}

export function getLatestRecordForSubjectSeed(
  subjectSeed: string
): AgeAssuranceConsentRecord | null {
  const candidateHashes = new Set(derivePrivacySessionHashCandidates(subjectSeed));
  const records = loadAgeRecords();
  return records.find((r) => candidateHashes.has(r.subjectHash)) || null;
}

/**
 * Helper to compute the complete server-side featurePermissions map for an environment & state.
 */
export function buildFeaturePermissionsMap(
  environment: OmniaAccessEnvironment,
  accountAccessState: AccountAccessState
): Record<FeatureAccessKey, boolean> {
  const keys = Object.keys(AGE_FEATURE_POLICY_MATRIX) as FeatureAccessKey[];
  const result = {} as Record<FeatureAccessKey, boolean>;

  for (const key of keys) {
    if (accountAccessState === 'ACCESS_SUSPENDED' || environment === 'BLOCKED') {
      result[key] = false;
    } else if (environment === 'OMNIA_ADULT' && accountAccessState === 'ADULT_ACCESS') {
      result[key] = true;
    } else if (
      environment === 'OMNIA_YOUTH' &&
      (accountAccessState === 'MINOR_RESTRICTED_ACCESS' ||
        accountAccessState === 'PARENTAL_CONSENT_VERIFIED')
    ) {
      result[key] = Boolean(AGE_FEATURE_POLICY_MATRIX[key].allowedForMinorSafeVerified);
    } else {
      result[key] = false;
    }
  }

  return result;
}

/**
 * Detects client attempts to spoof authorization roles or age/consent verification via HTTP headers or body fields.
 */
export function detectSpoofedAccessClaims(req: express.Request): {
  spoofed: boolean;
  reason?: string;
} {
  const forbiddenHeaders = [
    'x-age-verified',
    'x-parental-consent-verified',
    'x-vizra-role',
    'x-omnia-environment-override',
    'x-bypass-age-gate',
  ];
  for (const h of forbiddenHeaders) {
    if (req.headers[h] !== undefined) {
      return {
        spoofed: true,
        reason: `Client-supplied authorization header "${h}" is forbidden. Access control is enforced strictly server-side.`,
      };
    }
  }
  const body = (req.body || {}) as Record<string, unknown>;
  if (
    body.verified === true ||
    body.bypass === true ||
    body.autoApprove === true ||
    body.emailConfirmedOnly === true ||
    body.checkboxOnly === true ||
    body.forceAdult === true
  ) {
    return {
      spoofed: true,
      reason:
        'Client-supplied verification overrides, plain email confirmations, or checkbox-only claims are forbidden.',
    };
  }
  return { spoofed: false };
}

/**
 * Computes exact UTC age in completed calendar years from an ISO YYYY-MM-DD date string
 * and applies jurisdiction-specific digital consent thresholds.
 * Age declaration is treated strictly as an initial routing mechanism, NEVER proof of adulthood.
 */
export function evaluateDateOfBirth(
  dobIso: string,
  referenceDate: Date = new Date(),
  jurisdictionInput: string = 'GLOBAL'
): AgeEvaluationResult {
  const rule = resolveJurisdictionRule(jurisdictionInput);

  const invalidResult = (error: string): AgeEvaluationResult => ({
    valid: false,
    error,
    ageStatus: 'UNDECLARED',
    jurisdiction: rule.code,
    digitalConsentAge: rule.digitalConsentAge,
    belowDigitalConsentThreshold: true,
    applicableStatutes: rule.applicableStatutes,
    legalBasisNote: rule.parentalConsentRuleSummary,
    verificationStandardNote: rule.verificationStandardNote,
    ageAssuranceMethod: 'SELF_DECLARATION_ROUTING_ONLY',
    recommendedEnvironment: 'BLOCKED',
    accountAccessState: 'AGE_VERIFICATION_REQUIRED',
    activePolicyDecision: 'DENY_UNDER_13_INELIGIBLE',
    option2PreparatoryDecision: 'BLOCKED_UNDER_13',
    parentalVerificationRequired: true,
    parentalVerificationStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
  });

  if (typeof dobIso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dobIso.trim())) {
    return invalidResult('Date of birth must be formatted strictly as YYYY-MM-DD.');
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
    return invalidResult('Invalid calendar date of birth.');
  }

  if (dobDate.getTime() > referenceDate.getTime()) {
    return invalidResult('Date of birth cannot be in the future.');
  }

  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth() + 1;
  const refDay = referenceDate.getUTCDate();

  let age = refYear - year;
  if (refMonth < month || (refMonth === month && refDay < day)) {
    age -= 1;
  }

  if (age < 0 || age > 130) {
    return invalidResult('Date of birth is outside acceptable biological bounds.');
  }

  let bracket: AgeBracket;
  let ageStatus: AgeStatus;
  let option2Decision: AgeEvaluationResult['option2PreparatoryDecision'];
  let activePolicyDecision: AgeEvaluationResult['activePolicyDecision'];
  let recommendedEnvironment: OmniaAccessEnvironment;
  let accountAccessState: AccountAccessState;

  if (age < 13) {
    bracket = 'UNDER_13_BLOCKED';
    ageStatus = 'UNDER_13';
    option2Decision = 'BLOCKED_UNDER_13';
    activePolicyDecision = 'DENY_UNDER_13_INELIGIBLE';
    recommendedEnvironment = 'BLOCKED';
    accountAccessState = 'AGE_VERIFICATION_REQUIRED';
  } else if (age < 18) {
    bracket = 'TEEN_13_17_PENDING_PARENTAL_CONSENT';
    ageStatus = 'MINOR_13_17';
    option2Decision = 'REQUIRES_VERIFIABLE_PARENTAL_CONSENT';
    activePolicyDecision = 'ROUTE_OMNIA_YOUTH_PARENTAL_CONSENT';
    recommendedEnvironment = 'OMNIA_YOUTH';
    accountAccessState = 'PARENTAL_CONSENT_PENDING';
  } else {
    bracket = 'ADULT_18_PLUS';
    ageStatus = 'ADULT_18_PLUS';
    option2Decision = 'ELIGIBLE_ADULT';
    activePolicyDecision = 'ALLOW_OMNIA_ADULT';
    recommendedEnvironment = 'OMNIA_ADULT';
    accountAccessState = 'ADULT_ACCESS';
  }

  const belowJurisdictionThreshold = age < rule.digitalConsentAge;
  const parentalVerificationRequired = age < 18;

  return {
    valid: true,
    ageYears: age,
    ageStatus,
    bracket,
    jurisdiction: rule.code,
    digitalConsentAge: rule.digitalConsentAge,
    belowDigitalConsentThreshold: belowJurisdictionThreshold,
    applicableStatutes: rule.applicableStatutes,
    legalBasisNote: rule.parentalConsentRuleSummary,
    verificationStandardNote: rule.verificationStandardNote,
    ageAssuranceMethod: 'SELF_DECLARATION_ROUTING_ONLY',
    recommendedEnvironment,
    accountAccessState,
    activePolicyDecision,
    option2PreparatoryDecision: option2Decision,
    parentalVerificationRequired,
    parentalVerificationStatus:
      age >= 18
        ? 'NOT_REQUIRED'
        : age < 13
        ? 'BLOCKED_BY_EXTERNAL_DEPENDENCY'
        : 'PARENTAL_CONSENT_PENDING',
  };
}

/**
 * Evaluates feature restrictions under VIZRA Age Assurance & Parental Consent Framework.
 * Keeps age status, consent status, and feature permissions strictly separate.
 */
export function evaluateMinorFeatureAccess(
  bracket: AgeBracket,
  feature: FeatureAccessKey,
  parentalConsentVerified: boolean,
  options?: {
    allowOption4Simulation?: boolean;
    consentStatus?: ConsentLifecycleStatus;
    suspended?: boolean;
  }
): {
  allowed: boolean;
  reason: string;
  code: string;
  tierApplied: MinorProtectionTier;
  accountAccessState: AccountAccessState;
  environment: OmniaAccessEnvironment;
  requiresMinorSafeSafetySettings: boolean;
} {
  if (options?.suspended) {
    return {
      allowed: false,
      reason: 'Account access is currently suspended pending policy or safety review.',
      code: 'ACCESS_SUSPENDED',
      tierApplied: 'BLOCKED',
      accountAccessState: 'ACCESS_SUSPENDED',
      environment: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  if (bracket === 'ADULT_18_PLUS') {
    return {
      allowed: true,
      reason: 'Permitted under Omnia Adult access policy.',
      code: 'ALLOWED_OMNIA_ADULT',
      tierApplied: 'ADULT_STANDARD',
      accountAccessState: 'ADULT_ACCESS',
      environment: 'OMNIA_ADULT',
      requiresMinorSafeSafetySettings: false,
    };
  }

  if (bracket === 'UNDER_13_BLOCKED') {
    return {
      allowed: false,
      reason: 'Users under 13 are ineligible for Omnia Youth workspace capabilities.',
      code: 'UNDER_13_BLOCKED',
      tierApplied: 'BLOCKED',
      accountAccessState: 'AGE_VERIFICATION_REQUIRED',
      environment: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  if (
    options?.consentStatus === 'PARENTAL_CONSENT_REVOKED' ||
    options?.consentStatus === 'WITHDRAWN' ||
    options?.consentStatus === 'REVOKED'
  ) {
    return {
      allowed: false,
      reason: 'Parental consent has been revoked. Omnia Youth access is disabled.',
      code: 'PARENTAL_CONSENT_REVOKED',
      tierApplied: 'BLOCKED',
      accountAccessState: 'PARENTAL_CONSENT_REVOKED',
      environment: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  if (options?.consentStatus === 'EXPIRED') {
    return {
      allowed: false,
      reason: 'Parental consent has expired and must be renewed by a verified parent or guardian.',
      code: 'PARENTAL_CONSENT_EXPIRED',
      tierApplied: 'BLOCKED',
      accountAccessState: 'PARENTAL_CONSENT_PENDING',
      environment: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  if (!parentalConsentVerified) {
    return {
      allowed: false,
      reason: 'Verified parental consent is required prior to granting Omnia Youth workspace access.',
      code: 'PARENTAL_CONSENT_REQUIRED',
      tierApplied: 'BLOCKED',
      accountAccessState: 'PARENTAL_CONSENT_PENDING',
      environment: 'BLOCKED',
      requiresMinorSafeSafetySettings: true,
    };
  }

  const rule = AGE_FEATURE_POLICY_MATRIX[feature];
  if (!rule || !rule.allowedForMinorSafeVerified) {
    return {
      allowed: false,
      reason: `Capability "${feature}" is disabled for Omnia Youth accounts. Parental consent cannot override mandatory minor safeguards.`,
      code: 'FEATURE_RESTRICTED_FOR_MINOR',
      tierApplied: 'RESTRICTED_MINOR_SAFE',
      accountAccessState: 'MINOR_RESTRICTED_ACCESS',
      environment: 'OMNIA_YOUTH',
      requiresMinorSafeSafetySettings: true,
    };
  }

  return {
    allowed: true,
    reason: `Capability "${feature}" permitted under Omnia Youth verified minor-safe safeguards.`,
    code: 'ALLOWED_OMNIA_YOUTH',
    tierApplied: 'RESTRICTED_MINOR_SAFE',
    accountAccessState: 'MINOR_RESTRICTED_ACCESS',
    environment: 'OMNIA_YOUTH',
    requiresMinorSafeSafetySettings: true,
  };
}

export interface RequestAgePolicyContext {
  identified: boolean;
  authenticated: boolean;
  uid?: string;
  subjectSeed?: string;
  subjectHash?: string;
  record: AgeAssuranceConsentRecord | null;
  ageStatus: AgeStatus;
  consentStatus: ConsentLifecycleStatus;
  accountAccessState: AccountAccessState;
  environment: OmniaAccessEnvironment;
  jurisdiction: string;
  tier: MinorProtectionTier;
  isMinorBlocked: boolean;
  requiresMinorSafeDirectives: boolean;
  featurePermissions: Record<FeatureAccessKey, boolean>;
  resourceLimits: ResourceBoundaryPolicy;
  parentalConsentId?: string | null;
  parentUid?: string | null;
  reason?: string;
}

/**
 * Resolves the authoritative server-side age-assurance & parental-consent policy context
 * directly from a verified UID or subject seed (shared by HTTP routes and WebSocket upgrades).
 */
export function resolvePolicyContextForIdentity(params: {
  uid?: string;
  subjectSeed?: string;
  authenticated: boolean;
}): RequestAgePolicyContext {
  const subjectSeed = params.uid ? `uid:${params.uid}` : params.subjectSeed;

  if (!subjectSeed) {
    return {
      identified: false,
      authenticated: false,
      record: null,
      ageStatus: 'UNDECLARED',
      consentStatus: 'NOT_REQUIRED',
      accountAccessState: 'ADULT_ACCESS',
      environment: 'OMNIA_ADULT',
      jurisdiction: 'GLOBAL',
      tier: 'ADULT_STANDARD',
      isMinorBlocked: false,
      requiresMinorSafeDirectives: false,
      featurePermissions: buildFeaturePermissionsMap('OMNIA_ADULT', 'ADULT_ACCESS'),
      resourceLimits: ADULT_RESOURCE_LIMITS,
    };
  }

  const subjectHash = derivePrivacySessionHash(subjectSeed);
  const record = getLatestRecordForSubjectSeed(subjectSeed);

  // Check authoritative Firestore-aligned parental_consents + parent_child_relationships store for authenticated UIDs
  const parentalState = params.uid ? getLatestParentalConsentForChild(params.uid) : null;

  if (record?.suspended) {
    return {
      identified: true,
      authenticated: params.authenticated,
      uid: params.uid,
      subjectSeed,
      subjectHash,
      record,
      ageStatus: record.ageStatus || 'UNDECLARED',
      consentStatus: record.consentStatus,
      accountAccessState: 'ACCESS_SUSPENDED',
      environment: 'BLOCKED',
      jurisdiction: record.jurisdiction || 'GLOBAL',
      tier: 'BLOCKED',
      isMinorBlocked: true,
      requiresMinorSafeDirectives: true,
      featurePermissions: buildFeaturePermissionsMap('BLOCKED', 'ACCESS_SUSPENDED'),
      resourceLimits: YOUTH_RESOURCE_LIMITS,
      reason: record.suspensionReason || 'Account access suspended.',
    };
  }

  // If parental consent store has a record for this UID, it is the authoritative source of consent status!
  if (parentalState?.consent) {
    const pConsent = parentalState.consent;
    const isRevoked =
      pConsent.status === 'PARENTAL_CONSENT_REVOKED' ||
      record?.consentStatus === 'WITHDRAWN' ||
      record?.consentStatus === 'REVOKED' ||
      record?.consentStatus === 'PARENTAL_CONSENT_REVOKED';

    if (isRevoked) {
      return {
        identified: true,
        authenticated: params.authenticated,
        uid: params.uid,
        subjectSeed,
        subjectHash,
        record,
        ageStatus: record?.ageStatus || 'MINOR_13_17',
        consentStatus: 'PARENTAL_CONSENT_REVOKED',
        accountAccessState: 'PARENTAL_CONSENT_REVOKED',
        environment: 'BLOCKED',
        jurisdiction: pConsent.jurisdiction || record?.jurisdiction || 'GLOBAL',
        tier: 'BLOCKED',
        isMinorBlocked: true,
        requiresMinorSafeDirectives: true,
        featurePermissions: buildFeaturePermissionsMap('BLOCKED', 'PARENTAL_CONSENT_REVOKED'),
        resourceLimits: YOUTH_RESOURCE_LIMITS,
        parentalConsentId: pConsent.consent_id,
        parentUid: pConsent.parent_uid,
        reason: 'Parental consent has been revoked; Omnia Youth access is disabled.',
      };
    }

    if (parentalState.isExpired || pConsent.status === 'EXPIRED') {
      return {
        identified: true,
        authenticated: params.authenticated,
        uid: params.uid,
        subjectSeed,
        subjectHash,
        record,
        ageStatus: record?.ageStatus || 'MINOR_13_17',
        consentStatus: 'EXPIRED',
        accountAccessState: 'PARENTAL_CONSENT_PENDING',
        environment: 'BLOCKED',
        jurisdiction: pConsent.jurisdiction || record?.jurisdiction || 'GLOBAL',
        tier: 'BLOCKED',
        isMinorBlocked: true,
        requiresMinorSafeDirectives: true,
        featurePermissions: buildFeaturePermissionsMap('BLOCKED', 'PARENTAL_CONSENT_PENDING'),
        resourceLimits: YOUTH_RESOURCE_LIMITS,
        parentalConsentId: pConsent.consent_id,
        parentUid: pConsent.parent_uid,
        reason: 'Parental consent has expired and requires guardian renewal.',
      };
    }

    // Verified consent + active verified parent-child relationship → OMNIA YOUTH restricted access!
    // Never grant access if user was evaluated UNDER_13_BLOCKED.
    if (
      parentalState.isVerifiedAndActive &&
      record?.bracket !== 'UNDER_13_BLOCKED'
    ) {
      return {
        identified: true,
        authenticated: params.authenticated,
        uid: params.uid,
        subjectSeed,
        subjectHash,
        record,
        ageStatus: record?.ageStatus || 'MINOR_13_17',
        consentStatus: 'PARENTAL_CONSENT_VERIFIED',
        accountAccessState: 'MINOR_RESTRICTED_ACCESS',
        environment: 'OMNIA_YOUTH',
        jurisdiction: pConsent.jurisdiction || record?.jurisdiction || 'GLOBAL',
        tier: 'RESTRICTED_MINOR_SAFE',
        isMinorBlocked: false,
        requiresMinorSafeDirectives: true,
        featurePermissions: buildFeaturePermissionsMap('OMNIA_YOUTH', 'MINOR_RESTRICTED_ACCESS'),
        resourceLimits: YOUTH_RESOURCE_LIMITS,
        parentalConsentId: pConsent.consent_id,
        parentUid: pConsent.parent_uid,
        reason: 'Omnia Youth restricted minor-safe workspace active with verified parental consent.',
      };
    }

    // Pending or denied consent
    return {
      identified: true,
      authenticated: params.authenticated,
      uid: params.uid,
      subjectSeed,
      subjectHash,
      record,
      ageStatus: record?.ageStatus || 'MINOR_13_17',
      consentStatus: pConsent.status,
      accountAccessState: 'PARENTAL_CONSENT_PENDING',
      environment: 'BLOCKED',
      jurisdiction: pConsent.jurisdiction || record?.jurisdiction || 'GLOBAL',
      tier: 'BLOCKED',
      isMinorBlocked: true,
      requiresMinorSafeDirectives: true,
      featurePermissions: buildFeaturePermissionsMap('BLOCKED', 'PARENTAL_CONSENT_PENDING'),
      resourceLimits: YOUTH_RESOURCE_LIMITS,
      parentalConsentId: pConsent.consent_id,
      parentUid: pConsent.parent_uid,
      reason: 'Parental consent is pending independent guardian identity verification.',
    };
  }

  if (!record) {
    return {
      identified: true,
      authenticated: params.authenticated,
      uid: params.uid,
      subjectSeed,
      subjectHash,
      record: null,
      ageStatus: 'UNDECLARED',
      consentStatus: 'NOT_REQUIRED',
      accountAccessState: 'ADULT_ACCESS',
      environment: 'OMNIA_ADULT',
      jurisdiction: 'GLOBAL',
      tier: 'ADULT_STANDARD',
      isMinorBlocked: false,
      requiresMinorSafeDirectives: false,
      featurePermissions: buildFeaturePermissionsMap('OMNIA_ADULT', 'ADULT_ACCESS'),
      resourceLimits: ADULT_RESOURCE_LIMITS,
    };
  }

  if (
    record.consentStatus === 'WITHDRAWN' ||
    record.consentStatus === 'REVOKED' ||
    record.consentStatus === 'PARENTAL_CONSENT_REVOKED'
  ) {
    return {
      identified: true,
      authenticated: params.authenticated,
      uid: params.uid,
      subjectSeed,
      subjectHash,
      record,
      ageStatus: record.ageStatus || 'MINOR_13_17',
      consentStatus: 'PARENTAL_CONSENT_REVOKED',
      accountAccessState: 'PARENTAL_CONSENT_REVOKED',
      environment: 'BLOCKED',
      jurisdiction: record.jurisdiction || 'GLOBAL',
      tier: 'BLOCKED',
      isMinorBlocked: true,
      requiresMinorSafeDirectives: true,
      featurePermissions: buildFeaturePermissionsMap('BLOCKED', 'PARENTAL_CONSENT_REVOKED'),
      resourceLimits: YOUTH_RESOURCE_LIMITS,
      reason: 'Parental consent has been withdrawn/revoked; minor workspace access is disabled.',
    };
  }

  if (record.bracket === 'UNDER_13_BLOCKED') {
    return {
      identified: true,
      authenticated: params.authenticated,
      uid: params.uid,
      subjectSeed,
      subjectHash,
      record,
      ageStatus: 'UNDER_13',
      consentStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
      accountAccessState: 'AGE_VERIFICATION_REQUIRED',
      environment: 'BLOCKED',
      jurisdiction: record.jurisdiction || 'GLOBAL',
      tier: 'BLOCKED',
      isMinorBlocked: true,
      requiresMinorSafeDirectives: true,
      featurePermissions: buildFeaturePermissionsMap('BLOCKED', 'AGE_VERIFICATION_REQUIRED'),
      resourceLimits: YOUTH_RESOURCE_LIMITS,
      reason: 'Users under 13 are ineligible to use Omnia workspace services.',
    };
  }

  if (record.bracket !== 'ADULT_18_PLUS') {
    const isVerified =
      record.parentalConsentVerified &&
      (record.consentStatus === 'VERIFIED' || record.consentStatus === 'PARENTAL_CONSENT_VERIFIED');
    const environment: OmniaAccessEnvironment = isVerified ? 'OMNIA_YOUTH' : 'BLOCKED';
    const accountAccessState: AccountAccessState = isVerified
      ? 'MINOR_RESTRICTED_ACCESS'
      : 'PARENTAL_CONSENT_PENDING';
    const tier: MinorProtectionTier = isVerified ? 'RESTRICTED_MINOR_SAFE' : 'BLOCKED';

    return {
      identified: true,
      authenticated: params.authenticated,
      uid: params.uid,
      subjectSeed,
      subjectHash,
      record,
      ageStatus: 'MINOR_13_17',
      consentStatus: isVerified ? 'PARENTAL_CONSENT_VERIFIED' : 'PARENTAL_CONSENT_PENDING',
      accountAccessState,
      environment,
      jurisdiction: record.jurisdiction || 'GLOBAL',
      tier,
      isMinorBlocked: !isVerified,
      requiresMinorSafeDirectives: true,
      featurePermissions: buildFeaturePermissionsMap(environment, accountAccessState),
      resourceLimits: YOUTH_RESOURCE_LIMITS,
      reason: isVerified
        ? 'Omnia Youth restricted minor-safe protections active.'
        : 'Access restricted: verified parental consent required for Omnia Youth.',
    };
  }

  return {
    identified: true,
    authenticated: params.authenticated,
    uid: params.uid,
    subjectSeed,
    subjectHash,
    record,
    ageStatus: 'ADULT_18_PLUS',
    consentStatus: 'NOT_REQUIRED',
    accountAccessState: 'ADULT_ACCESS',
    environment: 'OMNIA_ADULT',
    jurisdiction: record.jurisdiction || 'GLOBAL',
    tier: 'ADULT_STANDARD',
    isMinorBlocked: false,
    requiresMinorSafeDirectives: false,
    featurePermissions: buildFeaturePermissionsMap('OMNIA_ADULT', 'ADULT_ACCESS'),
    resourceLimits: ADULT_RESOURCE_LIMITS,
  };
}

/**
 * Resolves the server-side persisted age-assurance state for an incoming HTTP request.
 * Checks verified Firebase UID first (`uid:<uid>`), then `X-Vizra-Client-Id` (`client:<id>`).
 * NEVER trusts client headers to self-declare or upgrade to adult access when a minor record exists.
 */
export async function resolveRequestAgePolicyContext(
  req: express.Request
): Promise<RequestAgePolicyContext> {
  let uid: string | undefined;
  let subjectSeed: string | undefined;
  let authenticated = false;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = await verifyFirebaseIdToken(token);
    if (verified.valid && verified.uid) {
      uid = verified.uid;
      subjectSeed = `uid:${verified.uid}`;
      authenticated = true;
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

  return resolvePolicyContextForIdentity({ uid, subjectSeed, authenticated });
}

/**
 * Centralized server-side access-control enforcement for Express API endpoints.
 * Verifies: authentication context, account status, age eligibility, parental consent,
 * feature permissions, jurisdictional restrictions, safety policy, and anti-spoofing guards.
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
  const spoofCheck = detectSpoofedAccessClaims(req);
  const ctx = await resolveRequestAgePolicyContext(req);

  if (spoofCheck.spoofed) {
    return {
      allowed: false,
      status: 403,
      code: 'SPOOFED_AUTHORIZATION_CLAIM_REJECTED',
      message: spoofCheck.reason,
      context: ctx,
    };
  }

  if (ctx.accountAccessState === 'ACCESS_SUSPENDED') {
    return {
      allowed: false,
      status: 403,
      code: 'ACCESS_SUSPENDED',
      message: ctx.reason || 'Account access is suspended.',
      context: ctx,
    };
  }

  if (ctx.environment === 'OMNIA_ADULT' && ctx.accountAccessState === 'ADULT_ACCESS') {
    return { allowed: true, status: 200, context: ctx };
  }

  const bracket: AgeBracket =
    ctx.ageStatus === 'UNDER_13'
      ? 'UNDER_13_BLOCKED'
      : ctx.ageStatus === 'ADULT_18_PLUS'
      ? 'ADULT_18_PLUS'
      : 'TEEN_13_17_PENDING_PARENTAL_CONSENT';

  const decision = evaluateMinorFeatureAccess(
    bracket,
    feature,
    ctx.consentStatus === 'PARENTAL_CONSENT_VERIFIED' &&
      ctx.environment === 'OMNIA_YOUTH',
    {
      consentStatus: ctx.consentStatus,
      suspended: ctx.record?.suspended,
    }
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

/**
 * Direct UID enforcement helper for WebSocket /live upgrades and server-to-server billing webhooks.
 */
export function enforceFeatureAccessForUid(
  uid: string,
  feature: FeatureAccessKey
): {
  allowed: boolean;
  code?: string;
  message?: string;
  context: RequestAgePolicyContext;
} {
  const ctx = resolvePolicyContextForIdentity({ uid, authenticated: true });
  if (ctx.accountAccessState === 'ACCESS_SUSPENDED') {
    return {
      allowed: false,
      code: 'ACCESS_SUSPENDED',
      message: ctx.reason || 'Account access suspended.',
      context: ctx,
    };
  }
  if (ctx.environment === 'OMNIA_ADULT' && ctx.accountAccessState === 'ADULT_ACCESS') {
    return { allowed: true, context: ctx };
  }
  const allowed = Boolean(ctx.featurePermissions[feature]);
  if (!allowed) {
    return {
      allowed: false,
      code:
        ctx.consentStatus === 'PARENTAL_CONSENT_REVOKED'
          ? 'PARENTAL_CONSENT_REVOKED'
          : ctx.environment === 'OMNIA_YOUTH'
          ? 'FEATURE_RESTRICTED_FOR_MINOR'
          : 'PARENTAL_CONSENT_REQUIRED',
      message:
        ctx.environment === 'OMNIA_YOUTH'
          ? `Capability "${feature}" is disabled for Omnia Youth accounts.`
          : ctx.reason || 'Verified parental consent is required.',
      context: ctx,
    };
  }
  return { allowed: true, context: ctx };
}

/**
 * Validates Omnia Youth restricted file-processing limits on chat attachments.
 */
export function validateYouthAttachmentRestrictions(
  attachments: any[],
  context: RequestAgePolicyContext
): { valid: boolean; error?: string; code?: string } {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return { valid: true };
  }
  if (context.environment !== 'OMNIA_YOUTH') {
    return { valid: true };
  }

  const limits = context.resourceLimits;
  if (attachments.length > limits.maxAttachments) {
    return {
      valid: false,
      code: 'YOUTH_ATTACHMENT_LIMIT_EXCEEDED',
      error: `Omnia Youth restricts file analysis to a maximum of ${limits.maxAttachments} attachments per message.`,
    };
  }

  const disallowedYouthExtensions = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.webm']);
  let totalDecodedBytes = 0;

  for (let i = 0; i < attachments.length; i += 1) {
    const att = attachments[i];
    if (!att || typeof att !== 'object') continue;
    const name = typeof att.name === 'string' ? att.name.toLowerCase().trim() : '';
    const dotIdx = name.lastIndexOf('.');
    if (dotIdx !== -1 && disallowedYouthExtensions.has(name.slice(dotIdx))) {
      return {
        valid: false,
        code: 'YOUTH_AUDIO_UPLOAD_RESTRICTED',
        error: 'Raw audio file uploads are disabled in Omnia Youth mode.',
      };
    }
    if (typeof att.previewUrl === 'string') {
      const match = att.previewUrl.match(/^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1].toLowerCase();
        if (mime.startsWith('audio/')) {
          return {
            valid: false,
            code: 'YOUTH_AUDIO_UPLOAD_RESTRICTED',
            error: 'Raw audio file uploads are disabled in Omnia Youth mode.',
          };
        }
        totalDecodedBytes += Math.ceil((match[2].length * 3) / 4);
        if (totalDecodedBytes > limits.maxDecodedAttachmentBytes) {
          return {
            valid: false,
            code: 'YOUTH_ATTACHMENT_SIZE_EXCEEDED',
            error: 'Omnia Youth restricts total attachment size to 5MB per prompt.',
          };
        }
      }
    }
  }

  return { valid: true };
}

async function resolveBoundSubjectSeed(
  req: express.Request,
  explicitSessionIdentifier?: unknown
): Promise<{ seed: string; uid?: string; email?: string; emailVerified?: boolean; authenticated: boolean }> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const verified = await verifyFirebaseIdToken(authHeader.slice(7).trim());
    if (verified.valid && verified.uid) {
      return {
        seed: `uid:${verified.uid}`,
        uid: verified.uid,
        email: verified.email,
        emailVerified: verified.emailVerified,
        authenticated: true,
      };
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

export function _resetAgeAssuranceRecordsForTests(): void {
  inMemoryAgeRecords = [];
}

export function setupAgeAssuranceRoutes(app: express.Application): void {
  const parentalProvider: ParentalVerificationProvider =
    new UnconfiguredParentalVerificationProvider();

  app.get('/api/compliance/age-assurance/policy', generalApiRateLimiter.getMiddleware(), (_req, res) => {
    const { webhookSecret } = getParentalConsentConfig();
    const externalProviderConfigured = Boolean(webhookSecret);
    const persistence = getConsentPersistenceStatus();

    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      supersededPolicy: LEGACY_SUPERSEDED_POLICY,
      policyVersion: CONSENT_POLICY_VERSION,
      environments: {
        OMNIA_ADULT: {
          minimumAge: 18,
          accessState: 'ADULT_ACCESS',
          description: 'Eligible adult users (18+) with full verified production capabilities.',
        },
        OMNIA_YOUTH: {
          eligibleAgeRange: '13-17 (subject to jurisdiction law & verified parental consent)',
          accessState: 'MINOR_RESTRICTED_ACCESS',
          enabled: OMNIA_YOUTH_ENABLED,
          allowedCapabilities: [
            'Core conversational AI (strict BLOCK_LOW_AND_ABOVE safety)',
            'Educational assistance',
            'Age-appropriate coding assistance',
            'Filtered grounded web research',
            'Restricted file analysis (max 2 files, <= 5 MB, no raw audio)',
            'Science Explorer (AlphaFold / PubChem / PubMed)',
          ],
          disabledCapabilities: [
            'Live Multimodal Voice (/live)',
            'Unrestricted audio & Lyria music synthesis',
            'Paid upgrades & commercial credit refills',
            'External third-party workspace OAuth connectors',
            'Sponsored/affiliate Engage targeting & behavioral profiling',
          ],
          parentalOverrideOfLegalRestrictionsAllowed: false,
        },
      },
      accountAccessStates: [
        'ADULT_ACCESS',
        'MINOR_RESTRICTED_ACCESS',
        'PARENTAL_CONSENT_PENDING',
        'PARENTAL_CONSENT_VERIFIED',
        'PARENTAL_CONSENT_REVOKED',
        'AGE_VERIFICATION_REQUIRED',
        'ACCESS_SUSPENDED',
      ],
      privacyFirstGuarantees: {
        ageDeclarationIsRoutingOnly: true,
        behaviouralAgeInferenceEnabled: BEHAVIOURAL_AGE_INFERENCE_ENABLED,
        minorBehaviouralProfilingEnabled: MINOR_BEHAVIOURAL_PROFILING_ENABLED,
        rawBirthdatesStored: false,
        rawIdentityDocumentsStored: false,
        childConversationsPrivateFromParentByDefault: true,
        ordinaryEmailOrCheckboxSufficient: false,
      },
      firebaseConsentInfrastructure: persistence,
      option2Preparatory: {
        active: OPTION_2_ACTIVE,
        status: 'ACTIVE_FRAMEWORK_FAIL_CLOSED_EXTERNAL_VERIFICATION',
        parentalVerificationProvider: externalProviderConfigured
          ? 'Configured Signed External VPC Webhook'
          : parentalProvider.providerName,
        parentalVendorConfigured: externalProviderConfigured,
      },
      option3ParentalConsent: {
        status: externalProviderConfigured
          ? 'CONFIGURED_SIGNED_WEBHOOK'
          : 'IMPLEMENTED_FAIL_CLOSED_REQUIRES_EXTERNAL_VPC_PROVIDER',
        jurisdictionsSupported: Object.keys(JURISDICTION_CONSENT_THRESHOLDS),
        parentalVendorConfigured: externalProviderConfigured,
        failClosed: true,
        supportsConsentWithdrawalAndCascadeErasure: true,
        externalBlockers: externalProviderConfigured
          ? []
          : [
              'Accredited external Verifiable Parental Consent identity/authority provider (e.g., Yoti, KWS, PRIVO, or India DPDP DigiLocker/Virtual Token verifier) credentials & PARENTAL_CONSENT_WEBHOOK_SECRET not configured.',
              'Formal regional legal counsel review required prior to enabling live production minor verification.',
            ],
      },
      option4FeatureRestrictions: {
        status: 'IMPLEMENTED_SERVER_ENFORCED',
        minorSafeProfile: 'RESTRICTED_MINOR_SAFE',
        geminiSafetyThreshold: 'BLOCK_LOW_AND_ABOVE',
        enforcedEndpoints: [
          'POST /api/chat',
          'POST /api/blog/agent',
          'POST /api/research',
          'POST /api/science/query',
          'POST /api/rag/embed',
          'POST /api/rag/embed/batch',
          'POST /api/music/generate',
          'POST /api/live/session',
          'WS /live (upgrade re-verification)',
          'GET /api/integrations/:provider/auth-url',
          'POST /api/credits/usage',
          'POST /api/billing/webhook',
          'GET/POST /api/engage/select',
        ],
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
      jurisdictions: Object.values(JURISDICTION_CONSENT_THRESHOLDS),
    });
  });

  app.get('/api/compliance/age-assurance/feature-matrix', generalApiRateLimiter.getMiddleware(), (_req, res) => {
    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      option5Rejected: OPTION_5_REJECTED,
      adultResourceLimits: ADULT_RESOURCE_LIMITS,
      youthResourceLimits: YOUTH_RESOURCE_LIMITS,
      featureMatrix: AGE_FEATURE_POLICY_MATRIX,
    });
  });

  app.post('/api/compliance/age-assurance/evaluate-feature', generalApiRateLimiter.getMiddleware(), (req, res) => {
    const spoofCheck = detectSpoofedAccessClaims(req);
    if (spoofCheck.spoofed) {
      res.status(403).json({
        error: {
          code: 'SPOOFED_AUTHORIZATION_CLAIM_REJECTED',
          message: spoofCheck.reason,
        },
      });
      return;
    }

    const { bracket, feature, parentalConsentVerified = false, consentStatus } = req.body || {};
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

    const decision = evaluateMinorFeatureAccess(
      bracket,
      feature as FeatureAccessKey,
      Boolean(parentalConsentVerified),
      { consentStatus }
    );

    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      activeDecision: decision,
      preparatoryOption4Decision: decision,
    });
  });

  app.get('/api/compliance/age-assurance/status', generalApiRateLimiter.getMiddleware(), async (req, res) => {
    const ctx = await resolveRequestAgePolicyContext(req);
    if (!ctx.identified) {
      res.status(401).json({
        error: {
          code: 'SUBJECT_IDENTIFICATION_REQUIRED',
          message:
            'Authenticated Bearer token or X-Vizra-Client-Id header required to query session age-assurance status.',
        },
      });
      return;
    }
    res.json({
      success: true,
      activePolicy: ACTIVE_AGE_POLICY,
      policyVersion: CONSENT_POLICY_VERSION,
      ageStatus: ctx.ageStatus,
      consentStatus: ctx.consentStatus,
      accountAccessState: ctx.accountAccessState,
      environment: ctx.environment,
      jurisdiction: ctx.jurisdiction,
      tier: ctx.tier,
      isMinorBlocked: ctx.isMinorBlocked,
      requiresMinorSafeDirectives: ctx.requiresMinorSafeDirectives,
      featurePermissions: ctx.featurePermissions,
      resourceLimits: ctx.resourceLimits,
      parentalConsentId: ctx.parentalConsentId || null,
      record: ctx.record
        ? {
            recordId: ctx.record.recordId,
            ageStatus: ctx.record.ageStatus,
            bracket: ctx.record.bracket,
            jurisdiction: ctx.record.jurisdiction,
            digitalConsentAge: ctx.record.digitalConsentAge,
            consentStatus: ctx.consentStatus,
            accountAccessState: ctx.accountAccessState,
            environment: ctx.environment,
            minorProtectionTier: ctx.tier,
            parentalConsentVerified: ctx.consentStatus === 'PARENTAL_CONSENT_VERIFIED',
            recordedAt: ctx.record.recordedAt,
            updatedAt: ctx.record.updatedAt,
            withdrawnAt: ctx.record.withdrawnAt,
          }
        : null,
    });
  });

  // STEP 1: Privacy-First Age Declaration & Jurisdiction Routing
  app.post('/api/compliance/age-assurance/evaluate', generalApiRateLimiter.getMiddleware(), async (req, res) => {
    const spoofCheck = detectSpoofedAccessClaims(req);
    if (spoofCheck.spoofed) {
      res.status(403).json({
        allowed: false,
        error: {
          code: 'SPOOFED_AUTHORIZATION_CLAIM_REJECTED',
          message: spoofCheck.reason,
        },
      });
      return;
    }

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

    // Anti-circumvention guard: once evaluated under-18, block upward self-declaration revision
    if (hasExplicitIdentity) {
      const priorRecord = getLatestRecordForSubjectSeed(boundSubject.seed);
      if (
        priorRecord &&
        priorRecord.bracket !== 'ADULT_18_PLUS' &&
        priorRecord.consentStatus !== 'WITHDRAWN' &&
        priorRecord.consentStatus !== 'PARENTAL_CONSENT_REVOKED' &&
        evaluation.bracket === 'ADULT_18_PLUS'
      ) {
        res.status(403).json({
          allowed: false,
          accountAccessState: 'AGE_VERIFICATION_REQUIRED',
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
        : 'PARENTAL_CONSENT_PENDING';

    // Record only non-PII bracket + salted hash + threshold metadata (ZERO raw DOB persisted)
    const record: AgeAssuranceConsentRecord = {
      recordId: `age_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`,
      subjectHash,
      childUid: boundSubject.uid,
      ageStatus: evaluation.ageStatus,
      bracket: evaluation.bracket!,
      jurisdiction: evaluation.jurisdiction,
      digitalConsentAge: evaluation.digitalConsentAge,
      applicableStatutes: evaluation.applicableStatutes,
      activePolicy: ACTIVE_AGE_POLICY,
      accountAccessState: evaluation.accountAccessState,
      environment: evaluation.bracket === 'ADULT_18_PLUS' ? 'OMNIA_ADULT' : 'BLOCKED',
      option2ActiveAtEvaluation: OPTION_2_ACTIVE,
      parentalConsentVerified: false,
      consentStatus,
      minorProtectionTier: evaluation.bracket === 'ADULT_18_PLUS' ? 'ADULT_STANDARD' : 'BLOCKED',
      recordedAt: nowIso,
      updatedAt: nowIso,
    };
    upsertAgeRecord(record);

    if (evaluation.bracket === 'UNDER_13_BLOCKED') {
      res.status(403).json({
        allowed: false,
        activePolicy: ACTIVE_AGE_POLICY,
        environment: 'BLOCKED',
        accountAccessState: 'AGE_VERIFICATION_REQUIRED',
        evaluation,
        recordId: record.recordId,
        error: {
          code: 'UNDER_13_INELIGIBLE',
          message:
            'Users under 13 are not eligible for Omnia workspace accounts under VIZRA age-assurance safeguards.',
        },
      });
      return;
    }

    if (evaluation.bracket === 'TEEN_13_17_PENDING_PARENTAL_CONSENT') {
      res.status(200).json({
        allowed: false,
        requiresParentalConsent: true,
        activePolicy: ACTIVE_AGE_POLICY,
        environment: 'OMNIA_YOUTH',
        accountAccessState: 'PARENTAL_CONSENT_PENDING',
        nextStep: {
          action: 'INITIATE_PARENTAL_CONSENT_INVITATION',
          endpoint: 'POST /api/compliance/parental-consent/invitations',
          portalPath: '/parental-consent',
          message:
            'Eligible for Omnia Youth upon independently verified parent or guardian consent. Sign in and generate a secure parent invitation.',
        },
        evaluation,
        recordId: record.recordId,
      });
      return;
    }

    res.json({
      allowed: true,
      requiresParentalConsent: false,
      activePolicy: ACTIVE_AGE_POLICY,
      environment: 'OMNIA_ADULT',
      accountAccessState: 'ADULT_ACCESS',
      evaluation,
      recordId: record.recordId,
    });
  });

  // STEPS 2–3: Authenticated Minor Requests Omnia Youth & Creates Secure Expiring Parent Invitation
  app.post(
    '/api/compliance/parental-consent/invitations',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const spoofCheck = detectSpoofedAccessClaims(req);
      if (spoofCheck.spoofed) {
        res.status(403).json({
          error: {
            code: 'SPOOFED_AUTHORIZATION_CLAIM_REJECTED',
            message: spoofCheck.reason,
          },
        });
        return;
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Sign in with Firebase Authentication to initiate a parental consent request.',
          },
        });
        return;
      }

      const verified = await verifyFirebaseIdToken(authHeader.slice(7).trim());
      if (!verified.valid || !verified.uid) {
        res.status(401).json({
          error: {
            code: 'INVALID_AUTH_TOKEN',
            message: verified.error || 'Invalid or expired authentication token.',
          },
        });
        return;
      }

      const { parentEmail, jurisdiction = 'GLOBAL', requestedScopes } = req.body || {};
      if (
        typeof parentEmail !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())
      ) {
        res.status(400).json({
          error: {
            code: 'INVALID_PARENT_EMAIL',
            message: 'A valid parent or guardian email address is required.',
          },
        });
        return;
      }

      const normalizedParentEmail = parentEmail.trim().toLowerCase();
      if (verified.email && verified.email.trim().toLowerCase() === normalizedParentEmail) {
        res.status(403).json({
          error: {
            code: 'PARENT_CHILD_EMAIL_CONFLICT',
            message:
              'Parent/guardian email must be distinct from the minor account email. Self-invitation is prohibited.',
          },
        });
        return;
      }

      // Verify child is not under-13 blocked
      const existingAgeRecord = getLatestRecordForSubjectSeed(`uid:${verified.uid}`);
      if (existingAgeRecord?.bracket === 'UNDER_13_BLOCKED') {
        res.status(403).json({
          error: {
            code: 'UNDER_13_INELIGIBLE',
            message: 'Accounts declared under 13 are ineligible for Omnia Youth onboarding.',
          },
        });
        return;
      }

      const rule = resolveJurisdictionRule(jurisdiction);
      const parentEmailHash = derivePrivacySessionHash(normalizedParentEmail);

      // Ensure a minor age-assurance record is bound to this UID if not yet present
      if (!existingAgeRecord || existingAgeRecord.bracket === 'ADULT_18_PLUS') {
        const nowIso = new Date().toISOString();
        upsertAgeRecord({
          recordId: `age_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`,
          subjectHash: derivePrivacySessionHash(`uid:${verified.uid}`),
          childUid: verified.uid,
          parentEmailHash,
          ageStatus: 'MINOR_13_17',
          bracket: 'TEEN_13_17_PENDING_PARENTAL_CONSENT',
          jurisdiction: rule.code,
          digitalConsentAge: rule.digitalConsentAge,
          applicableStatutes: rule.applicableStatutes,
          activePolicy: ACTIVE_AGE_POLICY,
          accountAccessState: 'PARENTAL_CONSENT_PENDING',
          environment: 'BLOCKED',
          option2ActiveAtEvaluation: OPTION_2_ACTIVE,
          parentalConsentVerified: false,
          consentStatus: 'PARENTAL_CONSENT_PENDING',
          minorProtectionTier: 'BLOCKED',
          recordedAt: nowIso,
          updatedAt: nowIso,
        });
      }

      const created = createOrReuseParentalInvitation({
        childUid: verified.uid,
        parentEmailHash,
        jurisdiction: rule.code,
        requestedScopes,
      });

      res.status(created.reusedExisting ? 200 : 201).json({
        success: true,
        reusedExistingInvitation: created.reusedExisting,
        consentId: created.consent.consent_id,
        invitationId: created.invitation.invitation_id,
        invitationToken: created.rawToken,
        invitationPath: `/parental-consent?invite=${encodeURIComponent(created.rawToken)}`,
        jurisdiction: rule.code,
        digitalConsentAge: rule.digitalConsentAge,
        applicableStatutes: rule.applicableStatutes,
        status: created.consent.status,
        expiresAt: created.invitation.expires_at,
        policyVersion: CONSENT_POLICY_VERSION,
        disclosureNote:
          'Share this expiring invitation link with your parent or legal guardian. They must sign in with their own separate account and complete independent verification.',
      });
    }
  );

  // STEPS 4–5: Inspect Parent Invitation + Full Transparent Consent Disclosure
  app.get(
    '/api/compliance/parental-consent/invitations/:token',
    generalApiRateLimiter.getMiddleware(),
    (req, res) => {
      const rawToken = String(req.params.token || '').trim();
      const { invitation, expired } = getInvitationByRawToken(rawToken);
      if (!invitation) {
        res.status(404).json({
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Parental consent invitation was not found or is invalid.',
          },
        });
        return;
      }

      if (expired || invitation.status === 'EXPIRED') {
        res.status(410).json({
          expired: true,
          error: {
            code: 'INVITATION_EXPIRED',
            message: 'This parental consent invitation has expired. Ask the minor to create a new invitation.',
          },
        });
        return;
      }

      if (invitation.status !== 'PENDING') {
        res.status(409).json({
          error: {
            code: `INVITATION_${invitation.status}`,
            message: `This invitation is no longer active (status: ${invitation.status}).`,
          },
        });
        return;
      }

      const rule = resolveJurisdictionRule(invitation.jurisdiction);
      const { webhookSecret } = getParentalConsentConfig();

      res.json({
        success: true,
        invitation: {
          invitationId: invitation.invitation_id,
          consentId: invitation.consent_id,
          jurisdiction: invitation.jurisdiction,
          jurisdictionLabel: rule.label,
          applicableStatutes: rule.applicableStatutes,
          verificationStandardNote: rule.verificationStandardNote,
          requestedScopes: invitation.requested_scopes,
          status: invitation.status,
          expiresAt: invitation.expires_at,
          policyVersion: invitation.policy_version,
        },
        externalVerificationProviderConfigured: Boolean(webhookSecret),
        disclosure: PARENTAL_CONSENT_DISCLOSURE_PAYLOAD,
      });
    }
  );

  // STEPS 6–7: Independent Parent Authentication & Explicit Approval
  app.post(
    '/api/compliance/parental-consent/approve',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const spoofCheck = detectSpoofedAccessClaims(req);
      if (spoofCheck.spoofed) {
        res.status(403).json({
          verified: false,
          error: {
            code: 'SPOOFED_AUTHORIZATION_CLAIM_REJECTED',
            message: spoofCheck.reason,
          },
        });
        return;
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: {
            code: 'PARENT_AUTHENTICATION_REQUIRED',
            message: 'Parent or legal guardian must independently sign in with Firebase Authentication.',
          },
        });
        return;
      }

      const verifiedParent = await verifyFirebaseIdToken(authHeader.slice(7).trim());
      if (!verifiedParent.valid || !verifiedParent.uid) {
        res.status(401).json({
          error: {
            code: 'INVALID_PARENT_AUTH_TOKEN',
            message: verifiedParent.error || 'Invalid or expired parent authentication token.',
          },
        });
        return;
      }

      if (!verifiedParent.email || verifiedParent.emailVerified !== true) {
        res.status(403).json({
          error: {
            code: 'PARENT_EMAIL_VERIFICATION_REQUIRED',
            message:
              'Parent account must have a verified email address as a baseline authentication requirement before proceeding to identity verification.',
          },
        });
        return;
      }

      // Prevent a minor-flagged account from approving another minor's consent
      const parentAgeCtx = resolvePolicyContextForIdentity({
        uid: verifiedParent.uid,
        authenticated: true,
      });
      if (parentAgeCtx.ageStatus === 'MINOR_13_17' || parentAgeCtx.ageStatus === 'UNDER_13') {
        res.status(403).json({
          error: {
            code: 'PARENT_MUST_BE_ADULT',
            message: 'A minor account cannot grant parental consent.',
          },
        });
        return;
      }

      const {
        invitationToken,
        approvedScopes,
        acknowledgedDisclosures,
        policyVersion,
        providerAssertion,
        providerSignature,
      } = req.body || {};

      if (typeof invitationToken !== 'string' || !invitationToken.trim()) {
        res.status(400).json({
          error: {
            code: 'MISSING_INVITATION_TOKEN',
            message: 'A valid parental consent invitationToken is required.',
          },
        });
        return;
      }

      if (acknowledgedDisclosures !== true) {
        res.status(400).json({
          error: {
            code: 'DISCLOSURE_ACKNOWLEDGMENT_REQUIRED',
            message:
              'Parent/guardian must explicitly review and acknowledge the Omnia Youth privacy and restriction disclosures.',
          },
        });
        return;
      }

      if (policyVersion && policyVersion !== CONSENT_POLICY_VERSION) {
        res.status(409).json({
          error: {
            code: 'POLICY_VERSION_MISMATCH',
            message: `Consent disclosure version mismatch. Refresh to review current policy version ${CONSENT_POLICY_VERSION}.`,
          },
        });
        return;
      }

      // Check optional server-verified external VPC provider cryptographic assertion
      const { webhookSecret } = getParentalConsentConfig();
      let externalVerificationProof: {
        verified: boolean;
        providerReference: string;
        verificationMethod: 'SIGNED_EXTERNAL_VPC_PROVIDER';
        expiresAtIso?: string;
      } | null = null;

      if (providerAssertion !== undefined || providerSignature !== undefined) {
        if (!webhookSecret) {
          res.status(424).json({
            verified: false,
            error: {
              code: 'EXTERNAL_VPC_PROVIDER_NOT_CONFIGURED',
              message:
                'Server external verification provider secret is not configured; cannot accept verification assertions.',
            },
          });
          return;
        }
        const serializedAssertion =
          typeof providerAssertion === 'string'
            ? providerAssertion
            : JSON.stringify(providerAssertion || {});
        const expectedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(serializedAssertion)
          .digest('hex');

        if (
          typeof providerSignature !== 'string' ||
          !safeCompare(providerSignature.trim(), expectedSig)
        ) {
          res.status(401).json({
            verified: false,
            error: {
              code: 'INVALID_VERIFICATION_SIGNATURE',
              message: 'External parental verification cryptographic signature is invalid.',
            },
          });
          return;
        }

        let parsedAssertion: any = {};
        try {
          parsedAssertion =
            typeof providerAssertion === 'string' ? JSON.parse(providerAssertion) : providerAssertion;
        } catch {
          res.status(400).json({
            error: {
              code: 'INVALID_PROVIDER_ASSERTION',
              message: 'Malformed external verification assertion payload.',
            },
          });
          return;
        }

        if (
          parsedAssertion?.verified === true &&
          typeof parsedAssertion?.providerReference === 'string' &&
          parsedAssertion.providerReference.trim().length > 0
        ) {
          externalVerificationProof = {
            verified: true,
            providerReference: parsedAssertion.providerReference.trim().slice(0, 128),
            verificationMethod: 'SIGNED_EXTERNAL_VPC_PROVIDER',
            expiresAtIso:
              typeof parsedAssertion.expiresAt === 'string' ? parsedAssertion.expiresAt : undefined,
          };
        }
      }

      const parentEmailHash = derivePrivacySessionHash(verifiedParent.email.trim().toLowerCase());
      const outcome = recordParentApprovalAttempt({
        rawToken: invitationToken.trim(),
        parentUid: verifiedParent.uid,
        parentEmailHash,
        approvedScopes: Array.isArray(approvedScopes)
          ? (approvedScopes as ConsentScope[])
          : [...APPROVED_YOUTH_CONSENT_SCOPES],
        externalVerificationProof,
      });

      if (!outcome.ok) {
        res.status(outcome.status).json({
          verified: false,
          status: outcome.consent?.status || 'PARENTAL_CONSENT_PENDING',
          consentId: outcome.consent?.consent_id,
          relationshipStatus: outcome.relationship?.relationship_verification_status,
          error: {
            code: outcome.code,
            message: outcome.message,
          },
        });
        return;
      }

      // Sync the child's age-assurance record to verified MINOR_RESTRICTED_ACCESS
      if (outcome.consent) {
        const childSeed = `uid:${outcome.consent.child_uid}`;
        const existingChildRec = getLatestRecordForSubjectSeed(childSeed);
        const nowIso = new Date().toISOString();
        const rule = resolveJurisdictionRule(outcome.consent.jurisdiction);
        upsertAgeRecord({
          recordId: existingChildRec?.recordId || `age_${Date.now().toString(36)}`,
          subjectHash: derivePrivacySessionHash(childSeed),
          childUid: outcome.consent.child_uid,
          parentEmailHash,
          ageStatus: 'MINOR_13_17',
          bracket: 'TEEN_13_17_PENDING_PARENTAL_CONSENT',
          jurisdiction: rule.code,
          digitalConsentAge: rule.digitalConsentAge,
          applicableStatutes: rule.applicableStatutes,
          activePolicy: ACTIVE_AGE_POLICY,
          accountAccessState: 'MINOR_RESTRICTED_ACCESS',
          environment: 'OMNIA_YOUTH',
          option2ActiveAtEvaluation: true,
          parentalConsentVerified: true,
          consentStatus: 'PARENTAL_CONSENT_VERIFIED',
          minorProtectionTier: 'RESTRICTED_MINOR_SAFE',
          recordedAt: existingChildRec?.recordedAt || nowIso,
          updatedAt: nowIso,
        });
      }

      res.json({
        success: true,
        verified: true,
        accountAccessState: 'MINOR_RESTRICTED_ACCESS',
        environment: 'OMNIA_YOUTH',
        consent: outcome.consent,
        relationship: outcome.relationship,
        message: outcome.message,
      });
    }
  );

  // STEP 9: Review Consent Status (Strictly scoped to authenticated parent or child; zero child chat exposure)
  app.get(
    '/api/compliance/parental-consent/status',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Sign in to view parental consent records associated with your account.',
          },
        });
        return;
      }

      const verified = await verifyFirebaseIdToken(authHeader.slice(7).trim());
      if (!verified.valid || !verified.uid) {
        res.status(401).json({
          error: {
            code: 'INVALID_AUTH_TOKEN',
            message: verified.error || 'Invalid or expired authentication token.',
          },
        });
        return;
      }

      const ctx = resolvePolicyContextForIdentity({ uid: verified.uid, authenticated: true });
      const records = listParentalConsentsForActor(verified.uid);

      res.json({
        success: true,
        policyVersion: CONSENT_POLICY_VERSION,
        accountSummary: {
          ageStatus: ctx.ageStatus,
          consentStatus: ctx.consentStatus,
          accountAccessState: ctx.accountAccessState,
          environment: ctx.environment,
          jurisdiction: ctx.jurisdiction,
          featurePermissions: ctx.featurePermissions,
          resourceLimits: ctx.resourceLimits,
        },
        asChild: records.asChild,
        asParent: records.asParent,
        relationships: records.relationships,
        auditLogs: records.auditLogs,
        privacyGuarantee:
          'Private child conversations are not automatically disclosed to parents/guardians.',
      });
    }
  );

  // STEP 10: Prompt Consent Withdrawal / Revocation (Invalidates Omnia Youth access immediately)
  app.post(
    '/api/compliance/parental-consent/revoke',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authenticated parent/guardian or account holder sign-in is required to revoke consent.',
          },
        });
        return;
      }

      const verified = await verifyFirebaseIdToken(authHeader.slice(7).trim());
      if (!verified.valid || !verified.uid) {
        res.status(401).json({
          error: {
            code: 'INVALID_AUTH_TOKEN',
            message: verified.error || 'Invalid or expired authentication token.',
          },
        });
        return;
      }

      const { consentId, childUid, reason } = req.body || {};
      const result = revokeParentalConsent({
        actorUid: verified.uid,
        consentId: typeof consentId === 'string' ? consentId.trim() : undefined,
        childUid: typeof childUid === 'string' ? childUid.trim() : undefined,
        reason: typeof reason === 'string' ? reason : undefined,
      });

      if (!result.ok) {
        res.status(result.status).json({
          error: {
            code: result.code,
            message: result.message,
          },
        });
        return;
      }

      // Synchronously update age_assurance_records for every revoked child UID so all endpoints deny immediately
      const nowIso = new Date().toISOString();
      for (const revoked of result.revokedConsents) {
        const childSeed = `uid:${revoked.child_uid}`;
        const existingRec = getLatestRecordForSubjectSeed(childSeed);
        const rule = resolveJurisdictionRule(revoked.jurisdiction);
        upsertAgeRecord({
          recordId: existingRec?.recordId || `age_rev_${Date.now().toString(36)}`,
          subjectHash: derivePrivacySessionHash(childSeed),
          childUid: revoked.child_uid,
          ageStatus: 'MINOR_13_17',
          bracket: 'TEEN_13_17_PENDING_PARENTAL_CONSENT',
          jurisdiction: rule.code,
          digitalConsentAge: rule.digitalConsentAge,
          applicableStatutes: rule.applicableStatutes,
          activePolicy: ACTIVE_AGE_POLICY,
          accountAccessState: 'PARENTAL_CONSENT_REVOKED',
          environment: 'BLOCKED',
          option2ActiveAtEvaluation: true,
          parentalConsentVerified: false,
          consentStatus: 'PARENTAL_CONSENT_REVOKED',
          minorProtectionTier: 'BLOCKED',
          recordedAt: existingRec?.recordedAt || nowIso,
          updatedAt: nowIso,
          withdrawnAt: nowIso,
        });
      }

      res.json({
        success: true,
        accountAccessState: 'PARENTAL_CONSENT_REVOKED',
        revokedCount: result.revokedConsents.length,
        revokedConsentIds: result.revokedConsents.map((c) => c.consent_id),
        revokedAt: nowIso,
        dataDeletionWorkflow: {
          endpoint: 'DELETE /api/account/data',
          settingsPath: '/settings',
          note: 'Omnia Youth workspace access has been invalidated immediately. The account holder may invoke DELETE /api/account/data to purge all stored data.',
        },
      });
    }
  );

  // Legacy endpoint retained with fail-closed behavior and explicit guidance to the invitation workflow
  app.post(
    '/api/compliance/age-assurance/parental-consent',
    generalApiRateLimiter.getMiddleware(),
    async (req, res) => {
      const spoofCheck = detectSpoofedAccessClaims(req);
      if (spoofCheck.spoofed) {
        res.status(403).json({
          verified: false,
          error: {
            code: 'SPOOFED_VERIFICATION_REJECTED',
            message: spoofCheck.reason,
          },
        });
        return;
      }

      const { parentEmail, jurisdiction = 'GLOBAL', sessionIdentifier } = req.body || {};
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
        childUid: boundSubject.uid,
        parentEmailHash,
        ageStatus: 'MINOR_13_17',
        bracket: 'TEEN_13_17_PENDING_PARENTAL_CONSENT',
        jurisdiction: rule.code,
        digitalConsentAge: rule.digitalConsentAge,
        applicableStatutes: rule.applicableStatutes,
        activePolicy: ACTIVE_AGE_POLICY,
        accountAccessState: 'PARENTAL_CONSENT_PENDING',
        environment: 'BLOCKED',
        option2ActiveAtEvaluation: OPTION_2_ACTIVE,
        parentalConsentVerified: false,
        consentStatus: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
        minorProtectionTier: 'BLOCKED',
        recordedAt: nowIso,
        updatedAt: nowIso,
      });

      res.status(424).json({
        verified: false,
        recordId,
        jurisdiction: rule.code,
        digitalConsentAge: rule.digitalConsentAge,
        status: outcome.status,
        recommendedEndpoint: 'POST /api/compliance/parental-consent/invitations',
        error: {
          code: outcome.code,
          message: outcome.message,
        },
      });
    }
  );

  // Signed External Verifiable Parental Consent Provider Webhook Callback (HMAC-SHA256 verified)
  app.post(
    '/api/compliance/age-assurance/parental-consent/callback',
    generalApiRateLimiter.getMiddleware(),
    (req, res) => {
      const { webhookSecret } = getParentalConsentConfig();
      if (!webhookSecret) {
        res.status(424).json({
          error: {
            code: 'PARENTAL_VERIFICATION_VENDOR_NOT_CONFIGURED',
            message:
              'External parental verification webhook secret is not configured. Signed callbacks remain fail-closed.',
          },
        });
        return;
      }

      const providedSig = String(req.headers['x-parental-signature'] || '').trim();
      const rawPayload =
        typeof (req as any).rawBody === 'string' && (req as any).rawBody.length > 0
          ? (req as any).rawBody
          : JSON.stringify(req.body || {});
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
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

      const { consentId, parentUid, providerReference, verified, expiresAt } = req.body || {};
      if (
        verified !== true ||
        typeof consentId !== 'string' ||
        typeof parentUid !== 'string' ||
        typeof providerReference !== 'string'
      ) {
        res.status(400).json({
          error: {
            code: 'INVALID_WEBHOOK_PAYLOAD',
            message: 'Signed callback requires verified: true, consentId, parentUid, and providerReference.',
          },
        });
        return;
      }

      const finalized = finalizeVerifiedParentalConsent({
        consentId: consentId.trim(),
        parentUid: parentUid.trim(),
        providerReference: providerReference.trim(),
        expiresAtIso: typeof expiresAt === 'string' ? expiresAt : undefined,
      });

      if (!finalized.ok || !finalized.consent) {
        res.status(400).json({
          error: {
            code: finalized.code,
            message: finalized.message,
          },
        });
        return;
      }

      const childSeed = `uid:${finalized.consent.child_uid}`;
      const existingRec = getLatestRecordForSubjectSeed(childSeed);
      const nowIso = new Date().toISOString();
      const rule = resolveJurisdictionRule(finalized.consent.jurisdiction);
      upsertAgeRecord({
        recordId: existingRec?.recordId || `age_vpc_${Date.now().toString(36)}`,
        subjectHash: derivePrivacySessionHash(childSeed),
        childUid: finalized.consent.child_uid,
        ageStatus: 'MINOR_13_17',
        bracket: 'TEEN_13_17_PENDING_PARENTAL_CONSENT',
        jurisdiction: rule.code,
        digitalConsentAge: rule.digitalConsentAge,
        applicableStatutes: rule.applicableStatutes,
        activePolicy: ACTIVE_AGE_POLICY,
        accountAccessState: 'MINOR_RESTRICTED_ACCESS',
        environment: 'OMNIA_YOUTH',
        option2ActiveAtEvaluation: true,
        parentalConsentVerified: true,
        consentStatus: 'PARENTAL_CONSENT_VERIFIED',
        minorProtectionTier: 'RESTRICTED_MINOR_SAFE',
        recordedAt: existingRec?.recordedAt || nowIso,
        updatedAt: nowIso,
      });

      res.json({
        success: true,
        accountAccessState: 'MINOR_RESTRICTED_ACCESS',
        environment: 'OMNIA_YOUTH',
        consent: finalized.consent,
        relationship: finalized.relationship,
      });
    }
  );

  // Backward-compatible withdrawal route synced with parental_consents revocation
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

      if (boundSubject.uid) {
        revokeParentalConsent({ actorUid: boundSubject.uid, reason: 'legacy_withdraw_endpoint' });
      }

      const candidateSubjectHashes = new Set(derivePrivacySessionHashCandidates(boundSubject.seed));
      const candidateParentHashes =
        typeof parentEmail === 'string' && parentEmail.includes('@')
          ? derivePrivacySessionHashCandidates(parentEmail.trim().toLowerCase())
          : null;

      const records = loadAgeRecords();
      const subjectRecords = records.filter((rec) => candidateSubjectHashes.has(rec.subjectHash));
      const registeredParentHashes = subjectRecords
        .map((rec) => rec.parentEmailHash)
        .filter((h): h is string => typeof h === 'string' && h.length > 0);

      if (!boundSubject.authenticated) {
        if (registeredParentHashes.length > 0) {
          const matchesRegisteredParent =
            candidateParentHashes !== null &&
            candidateParentHashes.some((cand) =>
              registeredParentHashes.some((h) => safeCompare(h, cand))
            );
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
        } else if (candidateParentHashes !== null) {
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
        if (!candidateSubjectHashes.has(rec.subjectHash)) return rec;
        updatedCount += 1;
        return {
          ...rec,
          parentalConsentVerified: false,
          consentStatus: 'PARENTAL_CONSENT_REVOKED' as ConsentLifecycleStatus,
          accountAccessState: 'PARENTAL_CONSENT_REVOKED' as AccountAccessState,
          environment: 'BLOCKED' as OmniaAccessEnvironment,
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
        consentStatus: 'PARENTAL_CONSENT_REVOKED',
        accountAccessState: 'PARENTAL_CONSENT_REVOKED',
        minorProtectionTier: 'BLOCKED',
        withdrawnAt: nowIso,
      });
    }
  );

  // Explicit guard proving Option 5 (unrestricted minor access / passive terms) stays permanently rejected
  app.post('/api/compliance/age-assurance/option-5-bypass', (_req, res) => {
    res.status(403).json({
      rejected: OPTION_5_REJECTED,
      error: {
        code: 'POLICY_OPTION_5_REJECTED',
        message: 'Option 5 (Unrestricted Access / Passive Terms Only) is permanently rejected.',
      },
    });
  });
}
