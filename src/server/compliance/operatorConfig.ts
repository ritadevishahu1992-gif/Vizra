import express from 'express';
import { generalApiRateLimiter } from '../security';

export interface OperatorFieldStatus {
  envVar: string;
  label: string;
  configured: boolean;
  valuePreview: string;
}

export interface ExternalDependencyStatus {
  dependency: string;
  configured: boolean;
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'BLOCKED_BY_EXTERNAL_DEPENDENCY';
  reason: string;
  requiredEnvVars: string[];
}

export interface ComplianceReadinessSnapshot {
  rec13Status: 'CONFIGURED' | 'BLOCKED_BY_EXTERNAL_DEPENDENCY';
  legalEntityFields: OperatorFieldStatus[];
  missingLegalFields: string[];
  cisionDependency: ExternalDependencyStatus;
  evaluatedAt: string;
}

function isRealEnvValue(val: string | undefined, placeholders: string[] = []): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  return !placeholders.includes(trimmed.toLowerCase());
}

/**
 * Evaluates REC-13 operator legal identity readiness (legal entity name, registered
 * address, DPO contact, governing law) and external PR/media dependency status (Cision)
 * without fabricating corporate credentials or API keys.
 */
export function getComplianceReadinessSnapshot(): ComplianceReadinessSnapshot {
  const legalFields: OperatorFieldStatus[] = [
    {
      envVar: 'VITE_LEGAL_ENTITY_NAME',
      label: 'Registered Legal Entity Name',
      configured: isRealEnvValue(process.env.VITE_LEGAL_ENTITY_NAME),
      valuePreview: isRealEnvValue(process.env.VITE_LEGAL_ENTITY_NAME)
        ? String(process.env.VITE_LEGAL_ENTITY_NAME).trim()
        : '[PENDING_COUNSEL_SIGN_OFF]',
    },
    {
      envVar: 'VITE_LEGAL_REGISTERED_ADDRESS',
      label: 'Registered Principal Office Address',
      configured: isRealEnvValue(process.env.VITE_LEGAL_REGISTERED_ADDRESS),
      valuePreview: isRealEnvValue(process.env.VITE_LEGAL_REGISTERED_ADDRESS)
        ? String(process.env.VITE_LEGAL_REGISTERED_ADDRESS).trim()
        : '[PENDING_COUNSEL_SIGN_OFF]',
    },
    {
      envVar: 'VITE_DPO_EMAIL',
      label: 'Designated Privacy / DPO Contact Email',
      configured: isRealEnvValue(process.env.VITE_DPO_EMAIL),
      valuePreview: isRealEnvValue(process.env.VITE_DPO_EMAIL)
        ? String(process.env.VITE_DPO_EMAIL).trim()
        : '[PENDING_COUNSEL_SIGN_OFF]',
    },
    {
      envVar: 'VITE_GOVERNING_LAW',
      label: 'Governing Law & Dispute Jurisdiction',
      configured: isRealEnvValue(process.env.VITE_GOVERNING_LAW),
      valuePreview: isRealEnvValue(process.env.VITE_GOVERNING_LAW)
        ? String(process.env.VITE_GOVERNING_LAW).trim()
        : '[PENDING_COUNSEL_SIGN_OFF]',
    },
  ];

  const missingLegalFields = legalFields.filter((f) => !f.configured).map((f) => f.envVar);

  const cisionConfigured =
    isRealEnvValue(process.env.CISION_API_KEY, ['your_cision_api_key', 'placeholder']) &&
    isRealEnvValue(process.env.CISION_CLIENT_SECRET, ['your_cision_client_secret', 'placeholder']);

  const cisionDependency: ExternalDependencyStatus = {
    dependency: 'Cision / PR Wire External API & Compliance Decision',
    configured: cisionConfigured,
    status: cisionConfigured ? 'CONFIGURED' : 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
    reason: cisionConfigured
      ? 'Cision API credentials configured.'
      : 'No Cision integration exists in the VIZRA codebase. External vendor contract/credentials (and REC-13 operator legal identity decisions if referencing Cision Recommendation 13) remain unconfigured.',
    requiredEnvVars: ['CISION_API_KEY', 'CISION_CLIENT_SECRET'],
  };

  return {
    rec13Status: missingLegalFields.length === 0 ? 'CONFIGURED' : 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
    legalEntityFields: legalFields,
    missingLegalFields,
    cisionDependency,
    evaluatedAt: new Date().toISOString(),
  };
}

export function setupOperatorComplianceRoutes(app: express.Application): void {
  app.get('/api/compliance/status', generalApiRateLimiter.getMiddleware(), (_req, res) => {
    const snapshot = getComplianceReadinessSnapshot();
    res.json({
      success: true,
      ...snapshot,
    });
  });

  app.post('/api/compliance/cision/dispatch', generalApiRateLimiter.getMiddleware(), (_req, res) => {
    const snapshot = getComplianceReadinessSnapshot();
    if (!snapshot.cisionDependency.configured) {
      res.status(424).json({
        error: {
          code: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
          message: snapshot.cisionDependency.reason,
          requiredEnvVars: snapshot.cisionDependency.requiredEnvVars,
        },
      });
      return;
    }
    res.status(501).json({
      error: {
        code: 'CISION_ENDPOINT_NOT_PROVISIONED',
        message: 'Cision credentials present, but commercial wire submission endpoint is not enabled without counsel sign-off.',
      },
    });
  });
}
