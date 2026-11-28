/**
 * VIZRA CENTRALIZED NO POWERS CAPABILITY REGISTRY
 *
 * Single authoritative source of truth for feature availability, production verification
 * status, eligible user groups (OMNIA_ADULT vs OMNIA_YOUTH), and refusal intelligence.
 *
 * Strict Governance Rule:
 * - Never mark a capability LIVE without verified production implementation evidence.
 * - Clearly distinguish LIVE, STAGED, UNAVAILABLE, RESTRICTED, and TEMPORARILY_UNAVAILABLE.
 */

export type CapabilityAvailabilityStatus =
  | 'LIVE'
  | 'STAGED'
  | 'UNAVAILABLE'
  | 'RESTRICTED'
  | 'TEMPORARILY_UNAVAILABLE';

export type ProductionVerificationStatus =
  | 'VERIFIED_IN_PRODUCTION'
  | 'NOT_DEPLOYED_STAGED'
  | 'NOT_INTEGRATED'
  | 'BLOCKED_BY_POLICY';

export type EligibleUserGroup = 'PUBLIC' | 'OMNIA_ADULT' | 'OMNIA_YOUTH' | 'NONE';

export interface CapabilityRegistryEntry {
  capabilityId: string;
  displayName: string;
  availabilityStatus: CapabilityAvailabilityStatus;
  productionVerificationStatus: ProductionVerificationStatus;
  eligibleUserGroups: EligibleUserGroup[];
  accessRequirements: string[];
  restrictionReason: string | null;
  userFacingExplanation: string;
  supportedAlternatives?: string[];
  lastVerificationTimestamp: string;
}

const VERIFIED_AT = '2026-11-28T05:30:00.000Z';

export const VIZRA_CAPABILITY_REGISTRY: readonly CapabilityRegistryEntry[] = [
  // ============================================================================
  // A. LIVE — VERIFIED IN PRODUCTION
  // ============================================================================
  {
    capabilityId: 'omnia_core_chat',
    displayName: 'Omnia 1.0 Core Conversational AI',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT', 'OMNIA_YOUTH'],
    accessRequirements: [
      'Server-side age-assurance evaluation',
      'Verified parental consent required for eligible Omnia Youth accounts',
      'Prompt length <= 50,000 chars and sliding-window rate limits',
    ],
    restrictionReason: null,
    userFacingExplanation:
      'Live in production via POST /api/chat. Omnia Youth sessions run with strict BLOCK_LOW_AND_ABOVE safety filters and educational minor-safe guardrails.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'omnia_educational_and_coding',
    displayName: 'Educational & Age-Appropriate Coding Assistance',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT', 'OMNIA_YOUTH'],
    accessRequirements: [
      'Active Omnia Adult or verified Omnia Youth session',
    ],
    restrictionReason: null,
    userFacingExplanation:
      'Live in production for explanations, tutoring, React/TypeScript/GLSL code generation, and debugging.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'omnia_web_research',
    displayName: 'Grounded Web Research & Verified Citations',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT', 'OMNIA_YOUTH'],
    accessRequirements: [
      'Active Omnia Adult or verified Omnia Youth session',
      'Filtered educational search safety rules enforced for Omnia Youth',
    ],
    restrictionReason: null,
    userFacingExplanation:
      'Live in production via POST /api/research and Google Search grounding with HTTPS citation validation.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'omnia_file_analysis',
    displayName: 'Multimodal File & Document Analysis',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT', 'OMNIA_YOUTH'],
    accessRequirements: [
      'Omnia Adult: up to 5 attachments, 10MB decoded limit (15MB JSON body), magic-byte verified',
      'Omnia Youth: restricted to max 2 attachments, 5MB decoded limit, educational text/document/image formats only (no raw audio uploads)',
    ],
    restrictionReason:
      'Omnia Youth sessions apply tighter attachment count, payload size, and MIME restrictions.',
    userFacingExplanation:
      'Live in production with server-side MIME allowlists, extension filtering, and binary magic-byte verification.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'omnia_science_hub',
    displayName: 'Science Explorer (AlphaFold DB / PubChem / PubMed)',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT', 'OMNIA_YOUTH'],
    accessRequirements: [
      'Active Omnia Adult or verified Omnia Youth session',
    ],
    restrictionReason: null,
    userFacingExplanation:
      'Live in production via POST /api/science/query querying public AlphaFold DB, PubChem, and PubMed APIs.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'local_rag_explorer',
    displayName: 'Browser-Local RAG Knowledge Base (25 MB)',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT', 'OMNIA_YOUTH'],
    accessRequirements: [
      'Max 25 MB per indexed file in browser local storage',
      'Embedding API protected by server-side age-assurance and prompt-safety middleware',
    ],
    restrictionReason: null,
    userFacingExplanation:
      'Live in production for client-side document chunking and grounded retrieval inside the workspace.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'free_prompt_optimizer',
    displayName: 'Free AI Prompt Optimizer Utility',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['PUBLIC', 'OMNIA_ADULT', 'OMNIA_YOUTH'],
    accessRequirements: ['None — deterministic browser-local utility at /free-ai-prompt-optimizer'],
    restrictionReason: null,
    userFacingExplanation:
      'Live in production with zero signup required; structures prompts across 7 creative disciplines locally in your browser.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'omnia_live_voice',
    displayName: 'Live Multimodal Voice Mode (WebSocket /live)',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT'],
    accessRequirements: [
      'Authenticated Firebase account',
      'ADULT_ACCESS (18+) required',
      'Single-use session ticket via POST /api/live/session',
    ],
    restrictionReason:
      'Disabled for all Omnia Youth / under-18 accounts to prevent unmoderated real-time audio interactions. Parental consent cannot override this restriction.',
    userFacingExplanation:
      'Live for verified adult (18+) authenticated accounts only. Disabled for Omnia Youth accounts.',
    supportedAlternatives: ['Use Omnia supervised text chat in /ai for educational and creative workflows.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'omnia_audio_music_synthesis',
    displayName: 'AI Music & Unrestricted Audio Synthesis (Lyria 3 / Procedural WAV)',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT'],
    accessRequirements: [
      'ADULT_ACCESS (18+) required',
      'POST /api/music/generate with EU AI Act Art. 50(2) synthetic provenance metadata',
    ],
    restrictionReason:
      'Unrestricted audio synthesis is disabled for Omnia Youth accounts initially under minor protection safeguards. Parental consent cannot override this restriction.',
    userFacingExplanation:
      'Live for Omnia Adult accounts. Disabled for Omnia Youth accounts.',
    supportedAlternatives: ['Use Omnia text chat to draft sound design notes, cue sheets, or musical structure outlines.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'paid_plan_upgrades',
    displayName: 'Paid Plan Upgrades & Commercial Credit Refills',
    availabilityStatus: 'LIVE',
    productionVerificationStatus: 'VERIFIED_IN_PRODUCTION',
    eligibleUserGroups: ['OMNIA_ADULT'],
    accessRequirements: [
      'ADULT_ACCESS (18+) required',
      'Server-verified payment webhook or administrator authorization',
    ],
    restrictionReason:
      'Paid commercial upgrades and credit refills are disabled for Omnia Youth / minor accounts.',
    userFacingExplanation:
      'Commercial upgrades are restricted to eligible adult accounts and verified payment-provider webhooks.',
    lastVerificationTimestamp: VERIFIED_AT,
  },

  // ============================================================================
  // B. STAGED — UNDER DEVELOPMENT / TESTING / R&D (NEVER CLAIM LIVE)
  // ============================================================================
  {
    capabilityId: 'temporal_video_synthesis',
    displayName: 'Temporal Video & Scene Synthesis',
    availabilityStatus: 'STAGED',
    productionVerificationStatus: 'NOT_DEPLOYED_STAGED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Internal R&D staging only; not released for public production use'],
    restrictionReason: 'Feature is in development/staging and not yet deployed to production.',
    userFacingExplanation:
      'Temporal Video & Scene Synthesis is currently STAGED (under development) and is not live in production.',
    supportedAlternatives: [
      'Draft shot-by-shot storyboards and timing cues in Omnia 1.0.',
      'Build interactive 60fps WebGL/GLSL motion shaders in Code mode.',
    ],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'omnia_spatial_director',
    displayName: 'Omnia Spatial Director (Project Aether)',
    availabilityStatus: 'STAGED',
    productionVerificationStatus: 'NOT_DEPLOYED_STAGED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Internal R&D prototype only'],
    restrictionReason: '3D multi-camera spatial blocking engine is in R&D staging and not released.',
    userFacingExplanation:
      'Omnia Spatial Director is STAGED in R&D and is not currently available as a live production engine.',
    supportedAlternatives: [
      'Generate Three.js / WebGL camera path code and blocking descriptions with Omnia 1.0.',
    ],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'harmonix_audio_engine',
    displayName: 'Harmonix',
    availabilityStatus: 'STAGED',
    productionVerificationStatus: 'NOT_DEPLOYED_STAGED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Internal R&D roadmap prototype'],
    restrictionReason: 'Harmonix is an experimental R&D roadmap concept and is not deployed in production.',
    userFacingExplanation:
      'Harmonix is currently STAGED on the VIZRA R&D roadmap and is not released in production.',
    supportedAlternatives: [
      'Adult accounts can use the live AI Music Studio (Lyria 3 / instrumental WAV synthesis).',
    ],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'chronos_timeline_engine',
    displayName: 'Chronos',
    availabilityStatus: 'STAGED',
    productionVerificationStatus: 'NOT_DEPLOYED_STAGED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Internal R&D roadmap prototype'],
    restrictionReason: 'Chronos is an upcoming R&D concept and is not released in production.',
    userFacingExplanation:
      'Chronos is currently STAGED in R&D and is not available in production.',
    supportedAlternatives: [
      'Use the live 10-Stage Project Workspace (/workspace) to manage production milestones and timelines.',
    ],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'syndicate_collab_engine',
    displayName: 'Syndicate',
    availabilityStatus: 'STAGED',
    productionVerificationStatus: 'NOT_DEPLOYED_STAGED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Internal R&D roadmap prototype'],
    restrictionReason: 'Syndicate multi-studio orchestration is in R&D staging and not deployed in production.',
    userFacingExplanation:
      'Syndicate is currently STAGED on the VIZRA roadmap and is not live in production.',
    supportedAlternatives: [
      'Export 10-stage project specifications as JSON from /workspace to share with collaborators.',
    ],
    lastVerificationTimestamp: VERIFIED_AT,
  },

  // ============================================================================
  // C. UNAVAILABLE — NOT INTEGRATED OR ENABLED IN PRODUCTION
  // ============================================================================
  {
    capabilityId: 'connector_google_drive',
    displayName: 'Google Drive Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: [
      'External OAuth client verification and credentials not enabled in production',
      'Disabled permanently for Omnia Youth accounts',
    ],
    restrictionReason: 'Google Drive live integration is not enabled in production.',
    userFacingExplanation:
      'Google Drive integration is currently UNAVAILABLE in production. Omnia cannot access your Google Drive files.',
    supportedAlternatives: ['Download your file locally and upload it directly into Omnia chat or the 25 MB Local RAG Explorer.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_google_docs',
    displayName: 'Google Docs Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'Google Docs live integration is not enabled in production.',
    userFacingExplanation:
      'Google Docs integration is currently UNAVAILABLE. Omnia cannot read or edit documents directly in Google Docs.',
    supportedAlternatives: ['Paste the document text or export as PDF/TXT and upload it directly to Omnia.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_google_sheets',
    displayName: 'Google Sheets Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'Google Sheets live integration is not enabled in production.',
    userFacingExplanation:
      'Google Sheets integration is currently UNAVAILABLE. Omnia cannot access live Google Sheets spreadsheets.',
    supportedAlternatives: ['Export your sheet as CSV and attach it in Omnia for structured analysis.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_github',
    displayName: 'GitHub Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'GitHub live repository connector is not enabled in production.',
    userFacingExplanation:
      'GitHub connector is currently UNAVAILABLE. Omnia cannot directly read private repositories, open pull requests, or commit code.',
    supportedAlternatives: ['Paste relevant code snippets or attach source files directly into Omnia Code mode.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_figma',
    displayName: 'Figma Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'Figma live connector is not enabled in production.',
    userFacingExplanation:
      'Figma integration is currently UNAVAILABLE. Omnia cannot read live Figma canvas files.',
    supportedAlternatives: ['Export frames as PNG/JPG or copy design tokens JSON and upload them into Omnia.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_canva',
    displayName: 'Canva Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'Canva live connector is not enabled in production.',
    userFacingExplanation:
      'Canva integration is currently UNAVAILABLE. Omnia cannot connect to or modify Canva projects.',
    supportedAlternatives: ['Export assets from Canva and attach them in Omnia for critique or redesign specs.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_youtube',
    displayName: 'YouTube Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'YouTube channel connector is not enabled in production.',
    userFacingExplanation:
      'YouTube integration is currently UNAVAILABLE. Omnia cannot access YouTube Studio analytics or publish videos.',
    supportedAlternatives: ['Paste a video transcript or script directly into Omnia for analysis and optimization.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_notion',
    displayName: 'Notion Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'Notion workspace connector is not enabled in production.',
    userFacingExplanation:
      'Notion integration is currently UNAVAILABLE. Omnia cannot read or sync live Notion databases.',
    supportedAlternatives: ['Export Notion pages as Markdown (.md) and index them in the Local RAG Explorer.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'connector_dropbox',
    displayName: 'Dropbox Connector',
    availabilityStatus: 'UNAVAILABLE',
    productionVerificationStatus: 'NOT_INTEGRATED',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['External OAuth integration not enabled in production'],
    restrictionReason: 'Dropbox integration is not implemented or enabled in production.',
    userFacingExplanation:
      'Dropbox integration is currently UNAVAILABLE. Omnia cannot browse or sync Dropbox folders.',
    supportedAlternatives: ['Download files locally and attach them directly in Omnia chat.'],
    lastVerificationTimestamp: VERIFIED_AT,
  },

  // ============================================================================
  // D. RESTRICTED — BLOCKED BY AGE, SAFETY, AUTHORIZATION, SECURITY, OR LAW
  // ============================================================================
  {
    capabilityId: 'restricted_private_user_data_access',
    displayName: 'Unauthorized Access to Private User Data',
    availabilityStatus: 'RESTRICTED',
    productionVerificationStatus: 'BLOCKED_BY_POLICY',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Strictly prohibited by Firestore Security Rules and server-side ownership verification'],
    restrictionReason:
      'Strict tenant isolation and privacy rules prevent accessing another user’s private conversations, profiles, projects, or consent records—including automatic exposure of private child conversations.',
    userFacingExplanation:
      'This action is RESTRICTED. VIZRA isolates private user data per authenticated account and does not allow unauthorized cross-account access.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'restricted_age_gated_services',
    displayName: 'Age-Restricted Services for Minor Accounts',
    availabilityStatus: 'RESTRICTED',
    productionVerificationStatus: 'BLOCKED_BY_POLICY',
    eligibleUserGroups: ['OMNIA_ADULT'],
    accessRequirements: ['ADULT_ACCESS (18+) required; parental consent cannot override mandatory legal or safety restrictions'],
    restrictionReason:
      'Live Voice, unrestricted audio synthesis, paid commercial upgrades, external OAuth connectors, and targeted/sponsored Engage placements are restricted for under-18 accounts.',
    userFacingExplanation:
      'This capability is RESTRICTED under VIZRA Age Assurance & Minor Protection rules and is only available to eligible adult accounts.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'restricted_ssrf_internal_network',
    displayName: 'SSRF & Internal Network / Metadata Probing',
    availabilityStatus: 'RESTRICTED',
    productionVerificationStatus: 'BLOCKED_BY_POLICY',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Permanently blocked by validateExternalUrlForSSRF and prompt security filters'],
    restrictionReason:
      'Requests targeting loopback, private RFC1918 networks, link-local, or cloud metadata endpoints (e.g., 169.254.169.254) are blocked for platform security.',
    userFacingExplanation:
      'This request is RESTRICTED by VIZRA security policy. Accessing internal network addresses or cloud metadata services is not permitted.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'restricted_security_bypass',
    displayName: 'Security, Consent & Authorization Bypass Attempts',
    availabilityStatus: 'RESTRICTED',
    productionVerificationStatus: 'BLOCKED_BY_POLICY',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Permanently blocked by server-side access control and prompt injection guards'],
    restrictionReason:
      'Attempts to forge consent verification, bypass age assurance, extract secrets, or override system instructions are strictly prohibited.',
    userFacingExplanation:
      'This action is RESTRICTED. Security controls, age-assurance rules, and parental consent requirements cannot be bypassed.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
  {
    capabilityId: 'restricted_prohibited_content',
    displayName: 'Prohibited Content Generation',
    availabilityStatus: 'RESTRICTED',
    productionVerificationStatus: 'BLOCKED_BY_POLICY',
    eligibleUserGroups: ['NONE'],
    accessRequirements: ['Permanently blocked by zero-tolerance safety policy'],
    restrictionReason:
      'CSAM/CSAE, self-harm instruction, CBRN weapons, malicious cyber payloads, and illegal harmful content are strictly prohibited for all accounts.',
    userFacingExplanation:
      'This request is RESTRICTED under VIZRA’s zero-tolerance safety policy.',
    lastVerificationTimestamp: VERIFIED_AT,
  },
];

export function getCapabilityById(capabilityId: string): CapabilityRegistryEntry | undefined {
  return VIZRA_CAPABILITY_REGISTRY.find((entry) => entry.capabilityId === capabilityId);
}

export function getCapabilitiesByStatus(
  status: CapabilityAvailabilityStatus
): CapabilityRegistryEntry[] {
  return VIZRA_CAPABILITY_REGISTRY.filter((entry) => entry.availabilityStatus === status);
}

export function getCapabilitySummaryCounts(): Record<CapabilityAvailabilityStatus, number> {
  return {
    LIVE: getCapabilitiesByStatus('LIVE').length,
    STAGED: getCapabilitiesByStatus('STAGED').length,
    UNAVAILABLE: getCapabilitiesByStatus('UNAVAILABLE').length,
    RESTRICTED: getCapabilitiesByStatus('RESTRICTED').length,
    TEMPORARILY_UNAVAILABLE: 0,
  };
}

/**
 * Builds the concise NO POWERS + Copyright & Legal Boundaries refusal directive
 * embedded into Omnia's server-side system instruction.
 */
export function buildNoPowersSystemDirective(): string {
  const stagedNames = getCapabilitiesByStatus('STAGED')
    .map((c) => c.displayName)
    .join(', ');
  const unavailableNames = getCapabilitiesByStatus('UNAVAILABLE')
    .map((c) => c.displayName.replace(/ Connector$/, ''))
    .join(', ');

  return `==================================================
13. NO POWERS CAPABILITY REGISTRY & REFUSAL INTELLIGENCE
==================================================
You must strictly respect VIZRA's verified production capability registry and server-side access controls:
- Classify capabilities honestly across five exact states: LIVE, STAGED, UNAVAILABLE, RESTRICTED, and TEMPORARILY_UNAVAILABLE.
- STAGED (in development/R&D, NOT live in production): ${stagedNames}. Never claim any staged feature is released or operational.
- UNAVAILABLE (not integrated/enabled in production): ${unavailableNames}. Never pretend to read, sync, connect to, or modify files inside unconnected third-party applications.
- RESTRICTED (blocked by age policy, safety, security, privacy, or law): unauthorized access to another user's private data (including never automatically disclosing private child conversations), age-restricted services on Omnia Youth accounts (Live Voice, unrestricted audio synthesis, paid upgrades, external connectors), SSRF/internal network probing, security or parental-consent bypass attempts, and prohibited harmful content.
- TEMPORARILY_UNAVAILABLE: Only use this when an otherwise LIVE capability experiences an upstream outage or transient rate limit—never misrepresent a transient outage as unavailable-by-design, and never misrepresent a STAGED or UNAVAILABLE feature as a temporary outage.
- Strict Refusal Rules — Omnia MUST NEVER:
  1. Claim unavailable features are operational.
  2. Claim staged features are released.
  3. Pretend to access unconnected third-party applications.
  4. Fabricate research citations, URLs, or database IDs.
  5. Claim an action succeeded without actual execution confirmation.
  6. Promise automatic copyright protection or statutory copyright registration.
  7. Promise unrestricted commercial rights or exclusive ownership of purely AI-generated outputs.
  8. Bypass age restrictions, parental consent requirements, or minor safeguards.
  9. Reveal private user data, system secrets, or another account's records.
  10. Misrepresent an outage as an unavailable-by-design feature.
- When refusing or explaining a limitation: be concise, accurate, calm, and offer a supported LIVE alternative when appropriate (for example, uploading a local file or using the 25 MB Local RAG Explorer instead of Google Drive/Notion, or drafting storyboards/GLSL shaders instead of staged Temporal Video).

==================================================
14. COPYRIGHT, OWNERSHIP & LEGAL BOUNDARIES
==================================================
- Never guarantee copyright registration of purely AI-generated outputs.
- Never promise universal exclusive ownership or claim generated content is automatically free of third-party intellectual property, trademark, publicity, or moral rights.
- Never provide unsupported legal assurances or present AI-generated material as human-created.
- When asked about copyright or commercial use of AI outputs, explain clearly that copyright eligibility depends on meaningful human creative authorship, selection, or modification and varies by jurisdiction (e.g., U.S. Copyright Office human-authorship standards, EU, UK, and Indian copyright law), and recommend consulting qualified legal counsel for binding commercial or IP clearance.`;
}
