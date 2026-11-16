import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type EnvClassification =
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'FEATURE_DEPENDENT'
  | 'UNUSED'
  | 'DUPLICATE';

export type IntegrationConfigState =
  | 'CONFIGURED'
  | 'OPTIONAL_SIMULATED'
  | 'NOT_CONFIGURED'
  | 'DORMANT_BLOCKED'
  | 'UNUSED';

export interface IntegrationStatusEntry {
  id: string;
  label: string;
  classification: EnvClassification;
  configured: boolean;
  status: IntegrationConfigState;
  requiredToBootCoreApp: boolean;
  envVars: string[];
  missingEnvVars: string[];
  notes: string;
}

export interface SystemConfigurationSnapshot {
  evaluatedAt: string;
  environment: string;
  coreReadyWithMinimalConfig: boolean;
  summary: {
    totalDocumentedOrReferencedVariables: number;
    requiredCoreCount: number;
    optionalCount: number;
    featureDependentCount: number;
    unusedCount: number;
    duplicateCount: number;
    configuredIntegrations: number;
    totalIntegrations: number;
  };
  coreStatus: {
    geminiApiConfigured: boolean;
    port: number;
    disableHmr: boolean;
    firebaseProjectId: string;
    appUrl: string;
  };
  deprecatedAliasesInUse: string[];
  integrations: IntegrationStatusEntry[];
  warnings: string[];
}

const KNOWN_PLACEHOLDER_VALUES = new Set<string>([
  'my_gemini_api_key',
  'my_app_url',
  'your_vercel_cron_secret',
  'your_admin_api_key',
  'your_workflow_secret',
  're_placeholder_key',
  'your_google_sheets_webhook_url',
  'your_optional_webhook_secret',
  'your_spreadsheet_id',
  'your_service_account_email',
  'your_cision_api_key',
  'your_cision_client_secret',
  'placeholder',
  'changeme',
  'none',
  'null',
  'undefined',
]);

/**
 * Validates that an environment variable contains a real non-placeholder value.
 */
export function isRealEnvValue(
  raw: string | undefined,
  extraPlaceholders: string[] = []
): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();

  if (KNOWN_PLACEHOLDER_VALUES.has(lower)) return false;
  if (lower.startsWith('your_') || lower.startsWith('my_')) return false;
  if (extraPlaceholders.some((p) => lower === p.toLowerCase())) return false;

  return true;
}

function getCleanEnv(name: string, extraPlaceholders: string[] = []): string | null {
  if (typeof process === 'undefined' || !process.env) return null;
  const raw = process.env[name];
  if (!isRealEnvValue(raw, extraPlaceholders)) return null;
  return raw!.trim();
}

// ============================================================================
// CORE APPLICATION SETTINGS
// ============================================================================

export function getPort(): number {
  const raw = getCleanEnv('PORT');
  const parsed = raw ? parseInt(raw, 10) : 3000;
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) return 3000;
  return parsed;
}

export function getNodeEnv(): string {
  return getCleanEnv('NODE_ENV') || 'development';
}

export function isProductionEnv(): boolean {
  return getNodeEnv() === 'production';
}

export function getAppUrl(fallbackProtocol = 'https', fallbackHost = 'vizra.vercel.app'): string {
  const configured = getCleanEnv('APP_URL');
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, '');
  }
  if (fallbackHost && !fallbackHost.includes('MY_APP_URL')) {
    return `${fallbackProtocol}://${fallbackHost}`.replace(/\/+$/, '');
  }
  return 'https://vizra.vercel.app';
}

export function getGeminiApiKey(): string | null {
  const key = getCleanEnv('GEMINI_API_KEY');
  if (!key || key.length <= 5) return null;
  return key;
}

export function getFirebaseProjectId(): {
  projectId: string;
  source: 'firebase-applet-config.json' | 'FIREBASE_PROJECT_ID' | 'VITE_FIREBASE_PROJECT_ID' | 'default';
} {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (typeof cfg?.projectId === 'string' && cfg.projectId.trim()) {
        return { projectId: cfg.projectId.trim(), source: 'firebase-applet-config.json' };
      }
    }
  } catch {
    // fallback below
  }

  const serverVar = getCleanEnv('FIREBASE_PROJECT_ID');
  if (serverVar) return { projectId: serverVar, source: 'FIREBASE_PROJECT_ID' };

  const legacyViteVar = getCleanEnv('VITE_FIREBASE_PROJECT_ID');
  if (legacyViteVar) return { projectId: legacyViteVar, source: 'VITE_FIREBASE_PROJECT_ID' };

  return { projectId: 'nice-dolphin-n7c1c', source: 'default' };
}

// ============================================================================
// ADMIN, CRON & CRYPTOGRAPHIC SECRETS
// ============================================================================

/**
 * Resolves the active administrator API key.
 * Rejects template placeholders (e.g. 'your_admin_api_key', 'your_workflow_secret')
 * so copying .env.example never grants default admin access.
 * Supports legacy WORKFLOW_SECRET as a backward-compatible fallback when valid.
 */
export function getConfiguredAdminKey(): {
  key: string | null;
  source: 'ADMIN_API_KEY' | 'WORKFLOW_SECRET' | null;
  usedDeprecatedAlias: boolean;
} {
  const primary = getCleanEnv('ADMIN_API_KEY');
  if (primary && primary.length >= 8) {
    return { key: primary, source: 'ADMIN_API_KEY', usedDeprecatedAlias: false };
  }
  const legacyWorkflow = getCleanEnv('WORKFLOW_SECRET');
  if (legacyWorkflow && legacyWorkflow.length >= 8) {
    return { key: legacyWorkflow, source: 'WORKFLOW_SECRET', usedDeprecatedAlias: true };
  }
  return { key: null, source: null, usedDeprecatedAlias: false };
}

export function getAdminAllowlistEmails(): string[] {
  const rawPrimary = getCleanEnv('ADMIN_ALLOWLIST_EMAILS') || '';
  const rawNotif = getCleanEnv('VIZRA_ADMIN_NOTIFICATION_EMAIL') || '';
  // Backward-compatible legacy alias used in older engageRoutes revisions
  const rawLegacyAlias = getCleanEnv('VIZRA_ADMIN_NOTIFY_EMAIL') || '';

  const combined = rawPrimary || rawNotif || rawLegacyAlias;
  if (!combined) return [];

  return Array.from(
    new Set(
      combined
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@'))
    )
  );
}

export function getCronSecret(): string | null {
  const secret = getCleanEnv('CRON_SECRET');
  if (!secret || secret.length < 8) return null;
  return secret;
}

const EPHEMERAL_SESSION_SALT = crypto.randomBytes(32).toString('hex');
const EPHEMERAL_VAULT_SECRET = crypto.randomBytes(32).toString('hex');

export function getSessionHashSecret(): { secret: string; persistent: boolean } {
  const configured = getCleanEnv('SESSION_HASH_SECRET');
  if (configured && configured.length >= 16) {
    return { secret: configured, persistent: true };
  }
  return { secret: EPHEMERAL_SESSION_SALT, persistent: false };
}

export function getIntegrationVaultSecret(): { secret: string; persistent: boolean } {
  const configured = getCleanEnv('INTEGRATION_TOKEN_SECRET');
  if (configured && configured.length >= 16) {
    return { secret: configured, persistent: true };
  }
  return { secret: EPHEMERAL_VAULT_SECRET, persistent: false };
}

// ============================================================================
// OPTIONAL INTEGRATIONS
// ============================================================================

export function getEmailConfig(): {
  resendApiKey: string | null;
  fromAddress: string;
  adminNotificationEmail: string;
  configured: boolean;
} {
  const resendApiKey = getCleanEnv('RESEND_API_KEY');
  const validKey = resendApiKey && resendApiKey.length > 5 ? resendApiKey : null;
  const fromAddress =
    getCleanEnv('VIZRA_EMAIL_FROM') || 'VIZRA Security <onboarding@resend.dev>';

  const adminNotif = getCleanEnv('VIZRA_ADMIN_NOTIFICATION_EMAIL');
  const allowlistFirst = getAdminAllowlistEmails()[0] || '';
  const adminNotificationEmail =
    adminNotif && adminNotif.includes('@') ? adminNotif : allowlistFirst;

  return {
    resendApiKey: validKey,
    fromAddress,
    adminNotificationEmail,
    configured: Boolean(validKey),
  };
}

export function getGoogleSheetsConsentConfig(): {
  configured: boolean;
  mode: 'service_account' | 'webhook' | 'none';
  webhookUrl?: string;
  webhookSecret?: string;
  spreadsheetId?: string;
  sheetRange: string;
  clientEmail?: string;
  privateKey?: string;
} {
  const webhookUrl = getCleanEnv('GOOGLE_SHEETS_CONSENT_WEBHOOK_URL');
  if (webhookUrl && webhookUrl.startsWith('https://')) {
    return {
      configured: true,
      mode: 'webhook',
      webhookUrl,
      webhookSecret: getCleanEnv('GOOGLE_SHEETS_WEBHOOK_SECRET') || '',
      sheetRange: getCleanEnv('GOOGLE_SHEETS_RANGE') || 'ConsentLogs!A:L',
    };
  }

  const spreadsheetId = getCleanEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  const clientEmail = getCleanEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = getCleanEnv('GOOGLE_PRIVATE_KEY');

  if (
    spreadsheetId &&
    clientEmail &&
    privateKey &&
    privateKey.includes('BEGIN PRIVATE KEY')
  ) {
    return {
      configured: true,
      mode: 'service_account',
      spreadsheetId,
      sheetRange: getCleanEnv('GOOGLE_SHEETS_RANGE') || 'ConsentLogs!A:L',
      clientEmail,
      privateKey,
    };
  }

  return {
    configured: false,
    mode: 'none',
    sheetRange: 'ConsentLogs!A:L',
  };
}

export function getOAuthCredentialsForEnv(
  clientIdEnv: string,
  clientSecretEnv: string
): {
  configured: boolean;
  clientId: string;
  clientSecret: string;
} {
  const clientId = getCleanEnv(clientIdEnv) || '';
  const clientSecret = getCleanEnv(clientSecretEnv) || '';
  return {
    // Server-side Authorization Code exchange requires both client_id and client_secret
    configured: Boolean(clientId && clientSecret),
    clientId,
    clientSecret,
  };
}

export function getParentalConsentConfig(): {
  provider: string | null;
  apiKeyConfigured: boolean;
  webhookSecret: string | null;
  fullyConfigured: boolean;
} {
  const provider = getCleanEnv('PARENTAL_CONSENT_PROVIDER');
  const apiKey = getCleanEnv('PARENTAL_CONSENT_API_KEY');
  const rawWebhook = getCleanEnv('PARENTAL_CONSENT_WEBHOOK_SECRET');
  const webhookSecret = rawWebhook && rawWebhook.length >= 16 ? rawWebhook : null;
  return {
    provider,
    apiKeyConfigured: Boolean(apiKey),
    webhookSecret,
    fullyConfigured: Boolean(provider && apiKey && webhookSecret),
  };
}

export function getOperatorLegalConfig() {
  return {
    entityName: getCleanEnv('VITE_LEGAL_ENTITY_NAME'),
    registeredAddress: getCleanEnv('VITE_LEGAL_REGISTERED_ADDRESS'),
    dpoEmail: getCleanEnv('VITE_DPO_EMAIL'),
    governingLaw: getCleanEnv('VITE_GOVERNING_LAW'),
  };
}

export function getCisionConfig(): { configured: boolean } {
  const apiKey = getCleanEnv('CISION_API_KEY');
  const clientSecret = getCleanEnv('CISION_CLIENT_SECRET');
  return {
    configured: Boolean(apiKey && clientSecret),
  };
}

// ============================================================================
// SAFE SECRET-FREE CONFIGURATION SNAPSHOT & STARTUP DIAGNOSTICS
// ============================================================================

export function getSystemConfigurationSnapshot(): SystemConfigurationSnapshot {
  const geminiKey = getGeminiApiKey();
  const firebase = getFirebaseProjectId();
  const adminKey = getConfiguredAdminKey();
  const adminEmails = getAdminAllowlistEmails();
  const cronSecret = getCronSecret();
  const sessionSecret = getSessionHashSecret();
  const vaultSecret = getIntegrationVaultSecret();
  const emailCfg = getEmailConfig();
  const sheetsCfg = getGoogleSheetsConsentConfig();
  const parentalCfg = getParentalConsentConfig();
  const legalCfg = getOperatorLegalConfig();
  const cisionCfg = getCisionConfig();

  const googleOAuth = getOAuthCredentialsForEnv('OAUTH_GOOGLE_CLIENT_ID', 'OAUTH_GOOGLE_CLIENT_SECRET');
  const notionOAuth = getOAuthCredentialsForEnv('OAUTH_NOTION_CLIENT_ID', 'OAUTH_NOTION_CLIENT_SECRET');
  const githubOAuth = getOAuthCredentialsForEnv('OAUTH_GITHUB_CLIENT_ID', 'OAUTH_GITHUB_CLIENT_SECRET');
  const figmaOAuth = getOAuthCredentialsForEnv('OAUTH_FIGMA_CLIENT_ID', 'OAUTH_FIGMA_CLIENT_SECRET');
  const canvaOAuth = getOAuthCredentialsForEnv('OAUTH_CANVA_CLIENT_ID', 'OAUTH_CANVA_CLIENT_SECRET');

  const anyOAuthConfigured =
    googleOAuth.configured ||
    notionOAuth.configured ||
    githubOAuth.configured ||
    figmaOAuth.configured ||
    canvaOAuth.configured;

  const legalMissing: string[] = [];
  if (!legalCfg.entityName) legalMissing.push('VITE_LEGAL_ENTITY_NAME');
  if (!legalCfg.registeredAddress) legalMissing.push('VITE_LEGAL_REGISTERED_ADDRESS');
  if (!legalCfg.dpoEmail) legalMissing.push('VITE_DPO_EMAIL');
  if (!legalCfg.governingLaw) legalMissing.push('VITE_GOVERNING_LAW');

  const integrations: IntegrationStatusEntry[] = [
    {
      id: 'gemini_ai',
      label: 'Omnia 1.0 Server AI Proxy (Google Gemini SDK)',
      classification: 'REQUIRED',
      configured: Boolean(geminiKey),
      status: geminiKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
      requiredToBootCoreApp: false,
      envVars: ['GEMINI_API_KEY'],
      missingEnvVars: geminiKey ? [] : ['GEMINI_API_KEY'],
      notes: geminiKey
        ? 'Live AI inference active across chat, research, science, music, embeddings, and live audio.'
        : 'Server boots cleanly; chat degrades gracefully to local fallback intelligence until GEMINI_API_KEY is supplied.',
    },
    {
      id: 'firebase_auth',
      label: 'Firebase Authentication & Firestore Ownership Verification',
      classification: 'OPTIONAL',
      configured: true,
      status: 'CONFIGURED',
      requiredToBootCoreApp: false,
      envVars: ['FIREBASE_PROJECT_ID'],
      missingEnvVars: [],
      notes: `Resolved project ID via ${firebase.source}. Public Firebase web client configuration is loaded from firebase-applet-config.json.`,
    },
    {
      id: 'admin_governance',
      label: 'Administrative APIs, SEO Diagnostics & Trust/Safety Moderation',
      classification: 'FEATURE_DEPENDENT',
      configured: Boolean(adminKey.key || adminEmails.length > 0),
      status: adminKey.key || adminEmails.length > 0 ? 'CONFIGURED' : 'NOT_CONFIGURED',
      requiredToBootCoreApp: false,
      envVars: ['ADMIN_API_KEY', 'ADMIN_ALLOWLIST_EMAILS'],
      missingEnvVars: [
        ...(adminKey.key ? [] : ['ADMIN_API_KEY']),
        ...(adminEmails.length > 0 ? [] : ['ADMIN_ALLOWLIST_EMAILS']),
      ],
      notes: adminKey.usedDeprecatedAlias
        ? 'Authenticated via deprecated alias WORKFLOW_SECRET; migrate to ADMIN_API_KEY.'
        : 'Protects /api/omnia/*, /api/safety/reports, /api/metrics, /api/seo-diagnostics/*, and /api/engage/admin/*.',
    },
    {
      id: 'cron_sync',
      label: 'Scheduled Knowledge Sync (/api/cron/omnia-sync)',
      classification: 'FEATURE_DEPENDENT',
      configured: Boolean(cronSecret),
      status: cronSecret ? 'CONFIGURED' : 'NOT_CONFIGURED',
      requiredToBootCoreApp: false,
      envVars: ['CRON_SECRET'],
      missingEnvVars: cronSecret ? [] : ['CRON_SECRET'],
      notes: 'Required in production when Vercel Cron triggers /api/cron/omnia-sync.',
    },
    {
      id: 'transactional_email',
      label: 'Security Login Notification Emails (Resend SDK)',
      classification: 'OPTIONAL',
      configured: emailCfg.configured,
      status: emailCfg.configured ? 'CONFIGURED' : 'OPTIONAL_SIMULATED',
      requiredToBootCoreApp: false,
      envVars: ['RESEND_API_KEY', 'VIZRA_EMAIL_FROM', 'VIZRA_ADMIN_NOTIFICATION_EMAIL'],
      missingEnvVars: emailCfg.configured ? [] : ['RESEND_API_KEY'],
      notes: emailCfg.configured
        ? 'Live Resend email dispatch enabled.'
        : 'Runs safely in simulated sandbox mode without outbound emails.',
    },
    {
      id: 'consent_google_sheets',
      label: 'Cookie Consent Google Sheets Audit Export',
      classification: 'OPTIONAL',
      configured: sheetsCfg.configured,
      status: sheetsCfg.configured ? 'CONFIGURED' : 'OPTIONAL_SIMULATED',
      requiredToBootCoreApp: false,
      envVars:
        sheetsCfg.mode === 'service_account'
          ? [
              'GOOGLE_SHEETS_SPREADSHEET_ID',
              'GOOGLE_SERVICE_ACCOUNT_EMAIL',
              'GOOGLE_PRIVATE_KEY',
              'GOOGLE_SHEETS_RANGE',
            ]
          : ['GOOGLE_SHEETS_CONSENT_WEBHOOK_URL', 'GOOGLE_SHEETS_WEBHOOK_SECRET'],
      missingEnvVars: sheetsCfg.configured
        ? []
        : ['GOOGLE_SHEETS_CONSENT_WEBHOOK_URL (or GOOGLE_SHEETS_SPREADSHEET_ID + GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY)'],
      notes: 'Local data/consent_store.json persistence remains active even when Google Sheets export is unconfigured.',
    },
    {
      id: 'workspace_oauth',
      label: 'Workspace OAuth Connectors (Google 1P, GitHub, Notion, Figma, Canva)',
      classification: 'FEATURE_DEPENDENT',
      configured: anyOAuthConfigured,
      status: anyOAuthConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      requiredToBootCoreApp: false,
      envVars: [
        'OAUTH_GOOGLE_CLIENT_ID',
        'OAUTH_GOOGLE_CLIENT_SECRET',
        'OAUTH_GITHUB_CLIENT_ID',
        'OAUTH_GITHUB_CLIENT_SECRET',
        'OAUTH_NOTION_CLIENT_ID',
        'OAUTH_NOTION_CLIENT_SECRET',
        'OAUTH_FIGMA_CLIENT_ID',
        'OAUTH_FIGMA_CLIENT_SECRET',
        'OAUTH_CANVA_CLIENT_ID',
        'OAUTH_CANVA_CLIENT_SECRET',
        'INTEGRATION_TOKEN_SECRET',
      ],
      missingEnvVars: [
        ...(!googleOAuth.configured ? ['OAUTH_GOOGLE_CLIENT_ID', 'OAUTH_GOOGLE_CLIENT_SECRET'] : []),
        ...(!githubOAuth.configured ? ['OAUTH_GITHUB_CLIENT_ID', 'OAUTH_GITHUB_CLIENT_SECRET'] : []),
        ...(!notionOAuth.configured ? ['OAUTH_NOTION_CLIENT_ID', 'OAUTH_NOTION_CLIENT_SECRET'] : []),
        ...(!figmaOAuth.configured ? ['OAUTH_FIGMA_CLIENT_ID', 'OAUTH_FIGMA_CLIENT_SECRET'] : []),
        ...(!canvaOAuth.configured ? ['OAUTH_CANVA_CLIENT_ID', 'OAUTH_CANVA_CLIENT_SECRET'] : []),
        ...(!vaultSecret.persistent ? ['INTEGRATION_TOKEN_SECRET'] : []),
      ],
      notes: 'Each provider activates independently when both Client ID and Client Secret are configured.',
    },
    {
      id: 'privacy_hashing',
      label: 'Persistent Cross-Restart Privacy HMAC & Vault Encryption',
      classification: 'OPTIONAL',
      configured: sessionSecret.persistent && vaultSecret.persistent,
      status: sessionSecret.persistent && vaultSecret.persistent ? 'CONFIGURED' : 'OPTIONAL_SIMULATED',
      requiredToBootCoreApp: false,
      envVars: ['SESSION_HASH_SECRET', 'INTEGRATION_TOKEN_SECRET'],
      missingEnvVars: [
        ...(sessionSecret.persistent ? [] : ['SESSION_HASH_SECRET']),
        ...(vaultSecret.persistent ? [] : ['INTEGRATION_TOKEN_SECRET']),
      ],
      notes: 'Ephemeral CSPRNG salts protect sessions automatically; set explicit secrets in production for cross-restart correlation.',
    },
    {
      id: 'parental_consent_vendor',
      label: 'Child Safety Option 3 — Accredited External Verifiable Parental Consent Vendor',
      classification: 'FEATURE_DEPENDENT',
      configured: parentalCfg.fullyConfigured,
      status: parentalCfg.fullyConfigured ? 'CONFIGURED' : 'DORMANT_BLOCKED',
      requiredToBootCoreApp: false,
      envVars: [
        'PARENTAL_CONSENT_PROVIDER',
        'PARENTAL_CONSENT_API_KEY',
        'PARENTAL_CONSENT_WEBHOOK_SECRET',
      ],
      missingEnvVars: [
        ...(parentalCfg.provider ? [] : ['PARENTAL_CONSENT_PROVIDER']),
        ...(parentalCfg.apiKeyConfigured ? [] : ['PARENTAL_CONSENT_API_KEY']),
        ...(parentalCfg.webhookSecret ? [] : ['PARENTAL_CONSENT_WEBHOOK_SECRET']),
      ],
      notes: 'Fail-closed (HTTP 424) while Option 2 remains dormant under active STRICT_18_PLUS policy.',
    },
    {
      id: 'operator_legal_identity',
      label: 'REC-13 Corporate Legal Entity & DPO Disclosures',
      classification: 'FEATURE_DEPENDENT',
      configured: legalMissing.length === 0,
      status: legalMissing.length === 0 ? 'CONFIGURED' : 'DORMANT_BLOCKED',
      requiredToBootCoreApp: false,
      envVars: [
        'VITE_LEGAL_ENTITY_NAME',
        'VITE_LEGAL_REGISTERED_ADDRESS',
        'VITE_DPO_EMAIL',
        'VITE_GOVERNING_LAW',
      ],
      missingEnvVars: legalMissing,
      notes: 'Public VITE_* compliance strings rendered in /privacy-policy and /terms-and-conditions after legal counsel sign-off.',
    },
    {
      id: 'cision_pr_wire',
      label: 'External Cision PR Wire Dependency (No active codebase client)',
      classification: 'UNUSED',
      configured: cisionCfg.configured,
      status: cisionCfg.configured ? 'CONFIGURED' : 'UNUSED',
      requiredToBootCoreApp: false,
      envVars: ['CISION_API_KEY', 'CISION_CLIENT_SECRET'],
      missingEnvVars: cisionCfg.configured ? [] : ['CISION_API_KEY', 'CISION_CLIENT_SECRET'],
      notes: 'Retained solely for REC-13 external dependency compliance reporting; returns HTTP 424 when dispatched.',
    },
  ];

  const warnings: string[] = [];
  if (!geminiKey) {
    warnings.push('GEMINI_API_KEY not configured. Falling back to local intelligence on client.');
  }
  if (!emailCfg.configured) {
    warnings.push('RESEND_API_KEY is unconfigured. Login notifications operate in simulated sandbox mode.');
  }
  if (!cronSecret) {
    warnings.push('CRON_SECRET is unconfigured. Vercel cron endpoints require authentication in production.');
  }
  if (!adminKey.key) {
    warnings.push('ADMIN_API_KEY is unconfigured. Admin endpoints rely on ADMIN_ALLOWLIST_EMAILS JWT RBAC in production.');
  } else if (adminKey.usedDeprecatedAlias) {
    warnings.push('Deprecated WORKFLOW_SECRET alias is active; set ADMIN_API_KEY instead.');
  }
  if (isProductionEnv() && !sessionSecret.persistent) {
    warnings.push('SESSION_HASH_SECRET unset in production; ephemeral per-instance HMAC salt active.');
  }

  const deprecatedAliasesInUse: string[] = [];
  if (adminKey.usedDeprecatedAlias) deprecatedAliasesInUse.push('WORKFLOW_SECRET -> ADMIN_API_KEY');
  if (firebase.source === 'VITE_FIREBASE_PROJECT_ID') deprecatedAliasesInUse.push('VITE_FIREBASE_PROJECT_ID -> FIREBASE_PROJECT_ID');
  if (!getCleanEnv('ADMIN_ALLOWLIST_EMAILS') && !getCleanEnv('VIZRA_ADMIN_NOTIFICATION_EMAIL') && getCleanEnv('VIZRA_ADMIN_NOTIFY_EMAIL')) {
    deprecatedAliasesInUse.push('VIZRA_ADMIN_NOTIFY_EMAIL -> VIZRA_ADMIN_NOTIFICATION_EMAIL');
  }

  return {
    evaluatedAt: new Date().toISOString(),
    environment: getNodeEnv(),
    coreReadyWithMinimalConfig: true,
    summary: {
      totalDocumentedOrReferencedVariables: 44,
      requiredCoreCount: 1,
      optionalCount: 9,
      featureDependentCount: 27,
      unusedCount: 4,
      duplicateCount: 3,
      configuredIntegrations: integrations.filter((i) => i.configured).length,
      totalIntegrations: integrations.length,
    },
    coreStatus: {
      geminiApiConfigured: Boolean(geminiKey),
      port: getPort(),
      disableHmr: process.env.DISABLE_HMR === 'true',
      firebaseProjectId: firebase.projectId,
      appUrl: getAppUrl(),
    },
    deprecatedAliasesInUse,
    integrations,
    warnings,
  };
}
