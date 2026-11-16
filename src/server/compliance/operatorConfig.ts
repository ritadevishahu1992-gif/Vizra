import express from 'express';
import { generalApiRateLimiter } from '../security';
import { getOperatorLegalConfig, getCisionConfig } from '../config/envConfig';

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

/**
 * Evaluates REC-13 operator legal identity readiness (legal entity name, registered
 * address, DPO contact, governing law) and external PR/media dependency status (Cision)
 * without fabricating corporate credentials or API keys.
 */
export function getComplianceReadinessSnapshot(): ComplianceReadinessSnapshot {
  const legal = getOperatorLegalConfig();
  const legalFields: OperatorFieldStatus[] = [
    {
      envVar: 'VITE_LEGAL_ENTITY_NAME',
      label: 'Registered Legal Entity Name',
      configured: Boolean(legal.entityName),
      valuePreview: legal.entityName || '[PENDING_COUNSEL_SIGN_OFF]',
    },
    {
      envVar: 'VITE_LEGAL_REGISTERED_ADDRESS',
      label: 'Registered Principal Office Address',
      configured: Boolean(legal.registeredAddress),
      valuePreview: legal.registeredAddress || '[PENDING_COUNSEL_SIGN_OFF]',
    },
    {
      envVar: 'VITE_DPO_EMAIL',
      label: 'Designated Privacy / DPO Contact Email',
      configured: Boolean(legal.dpoEmail),
      valuePreview: legal.dpoEmail || '[PENDING_COUNSEL_SIGN_OFF]',
    },
    {
      envVar: 'VITE_GOVERNING_LAW',
      label: 'Governing Law & Dispute Jurisdiction',
      configured: Boolean(legal.governingLaw),
      valuePreview: legal.governingLaw || '[PENDING_COUNSEL_SIGN_OFF]',
    },
  ];

  const missingLegalFields = legalFields.filter((f) => !f.configured).map((f) => f.envVar);
  const cisionConfigured = getCisionConfig().configured;

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
