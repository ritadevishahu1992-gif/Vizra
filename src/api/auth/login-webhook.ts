/**
 * VIZRA AUTHENTICATION LOGIN WEBHOOK HANDLER
 *
 * Listens for verified authentication events, validates the Firebase ID token
 * on the server, and triggers transactional email notifications via Resend
 * (`sendEmail` / `processLoginNotifications`) to notify both the authenticated
 * user and the system administrator.
 */

import type { Request, Response } from 'express';
import { verifyFirebaseIdToken, parseDeviceSummary } from '../../server/authVerification';
import { getTrustedClientIp, sanitizeServerError } from '../../server/security';
import { processLoginNotifications } from '../../server/email/loginNotificationService';
import { sendEmail, getDefaultSenderEmail, getAdminNotificationEmail } from '../../lib/email';

export { sendEmail, getDefaultSenderEmail, getAdminNotificationEmail };

export async function handleLoginWebhook(req: Request, res: Response): Promise<void> {
  if (req.method && req.method.toUpperCase() !== 'POST') {
    res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are accepted by the login webhook.',
      },
    });
    return;
  }

  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.body?.idToken && typeof req.body.idToken === 'string') {
    token = req.body.idToken.trim();
  } else if (req.body?.token && typeof req.body.token === 'string') {
    token = req.body.token.trim();
  }

  if (!token) {
    res.status(401).json({
      error: {
        code: 'MISSING_AUTH_TOKEN',
        message: 'Firebase authentication ID token required to verify login event',
      },
    });
    return;
  }

  const authEvent = await verifyFirebaseIdToken(token);
  if (!authEvent.valid || !authEvent.uid || !authEvent.email) {
    res.status(401).json({
      error: {
        code: 'INVALID_AUTH_TOKEN',
        message: authEvent.error || 'Invalid or expired authentication token',
      },
    });
    return;
  }

  try {
    const ipAddress = getTrustedClientIp(req);
    const userAgent = (req.headers['user-agent'] as string) || '';
    const deviceSummary = parseDeviceSummary(userAgent);

    const result = await processLoginNotifications({
      uid: authEvent.uid,
      email: authEvent.email,
      authTime: authEvent.authTime || Math.floor(Date.now() / 1000),
      ipAddress,
      userAgent,
      deviceSummary,
    });

    res.status(200).json({
      success: true,
      eventId: result.eventId,
      isDuplicate: result.isDuplicate,
      userDelivery: {
        status: result.userDelivery.status,
        messageId: result.userDelivery.messageId,
      },
      adminDelivery: {
        status: result.adminDelivery.status,
        messageId: result.adminDelivery.messageId,
      },
    });
  } catch (err: any) {
    console.error('[Login Webhook] Error dispatching login notifications:', err);
    res.status(200).json({
      success: false,
      error: sanitizeServerError(err, 'Login notification processing encountered an error'),
      fallback: true,
    });
  }
}

export default handleLoginWebhook;
