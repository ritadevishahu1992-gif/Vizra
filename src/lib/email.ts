/**
 * VIZRA SERVER-SIDE TRANSACTIONAL EMAIL SERVICE
 *
 * Uses the official Resend SDK to dispatch transactional emails securely.
 * All credentials and sender/recipient configurations are fetched strictly from
 * server-side environment variables (never hardcoded or exposed to the client).
 */

import { Resend } from 'resend';
import crypto from 'crypto';

export interface TransactionalEmailPayload {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

export interface TransactionalEmailResult {
  success: boolean;
  status: 'sent' | 'simulated' | 'failed';
  messageId?: string;
  error?: string;
}

/**
 * Safely retrieves the Resend API key from server-side environment variables.
 */
function getResendApiKey(): string | null {
  if (typeof process === 'undefined' || !process.env) {
    return null;
  }
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key === 're_placeholder_key' || key.length <= 5) {
    return null;
  }
  return key;
}

/**
 * Checks whether a live Resend API key is configured in the environment.
 */
export function isEmailServiceConfigured(): boolean {
  return getResendApiKey() !== null;
}

/**
 * Safely retrieves the default sender address from server-side environment variables.
 */
export function getDefaultSenderEmail(): string {
  return process.env.VIZRA_EMAIL_FROM?.trim() || 'VIZRA Security <onboarding@resend.dev>';
}

/**
 * Safely retrieves the administrator security notification email from server-side environment variables.
 */
export function getAdminNotificationEmail(): string {
  const configured = process.env.VIZRA_ADMIN_NOTIFICATION_EMAIL?.trim() || '';
  if (configured && configured.includes('@')) {
    return configured;
  }
  const allowlistFirst = (process.env.ADMIN_ALLOWLIST_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .find((e) => e.includes('@'));
  return allowlistFirst || '';
}

/**
 * Instantiates a Resend client using the environment API key.
 * Returns null if the API key is not configured.
 */
export function getResendClient(): Resend | null {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Masks an email address for safe server-side operational logging without PII leakage.
 */
function maskEmailAddress(email: string): string {
  return email.replace(/(?<=.)[^@](?=[^@]*?@)|(?<=@.)[^.](?=[^.]*?\.)/g, '*');
}

/**
 * Sends a transactional email using the Resend SDK.
 * Falls back to a safe simulated response in local/dev environments when RESEND_API_KEY is unconfigured,
 * ensuring zero secret exposure and non-blocking execution.
 */
export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload
): Promise<TransactionalEmailResult> {
  const fromAddress = payload.from?.trim() || getDefaultSenderEmail();
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  if (recipients.length === 0 || recipients.some((r) => !r || !r.includes('@'))) {
    return {
      success: false,
      status: 'failed',
      error: 'Invalid recipient email address provided.',
    };
  }

  const resend = getResendClient();

  if (!resend) {
    const maskedRecipients = recipients.map(maskEmailAddress).join(', ');
    console.log(
      `[Email Service: Simulated] Transactional email to ${maskedRecipients} prepared (${payload.subject}). RESEND_API_KEY not configured.`
    );
    return {
      success: true,
      status: 'simulated',
      messageId: `sim_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
      ...(payload.cc ? { cc: payload.cc } : {}),
      ...(payload.bcc ? { bcc: payload.bcc } : {}),
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
      ...(payload.headers ? { headers: payload.headers } : {}),
      ...(payload.tags ? { tags: payload.tags } : {}),
    });

    if (error) {
      return {
        success: false,
        status: 'failed',
        error: `Resend SDK Error (${error.name || 'unknown'}): ${error.message}`,
      };
    }

    return {
      success: true,
      status: 'sent',
      messageId: data?.id || `resend_${Date.now()}`,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'failed',
      error: err?.message || 'Unexpected error during Resend email dispatch.',
    };
  }
}

/**
 * Convenience alias for sendTransactionalEmail.
 */
export const sendEmail = sendTransactionalEmail;

