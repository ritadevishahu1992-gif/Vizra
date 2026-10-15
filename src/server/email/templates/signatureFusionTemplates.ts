/**
 * VIZRA SIGNATURE FUSION EMAIL TEMPLATES
 * 
 * Aesthetic Direction: Apple-level luxury + futuristic visuals + intelligence-system precision.
 * Target Clients: Apple Mail, Gmail, Outlook, mobile webviews, desktop clients.
 * Structural: Strict table-based layout, inline CSS, high-contrast typography, zero external script dependencies.
 */

export interface UserLoginNotificationParams {
  email: string;
  loginTime: string;
  timezone: string;
  ipAddress?: string;
  userAgent?: string;
  deviceSummary?: string;
  securityUrl: string;
  correlationId: string;
}

export interface AdminLoginNotificationParams {
  userEmail: string;
  userId: string;
  loginTime: string;
  timezone: string;
  ipAddress?: string;
  userAgent?: string;
  deviceSummary?: string;
  correlationId: string;
  authProvider: string;
  adminDashboardUrl: string;
  deliveryStatus: string;
}

/**
 * Escapes dynamic string content to strictly prevent HTML injection or XSS in email clients.
 */
export function escapeHtml(input?: string): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Masks user email for minimized exposure in user notification headers (e.g. a***h@gmail.com).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 5))}${user.slice(-1)}@${domain}`;
}

// ============================================================================
// 1. USER EMAIL VARIANT: LUXURY VIZRA SIGNATURE FUSION
// ============================================================================

export function renderUserLoginEmailHtml(params: UserLoginNotificationParams): string {
  const safeEmail = escapeHtml(params.email);
  const safeMaskedEmail = escapeHtml(maskEmail(params.email));
  const safeTime = escapeHtml(params.loginTime);
  const safeTz = escapeHtml(params.timezone);
  const safeIp = params.ipAddress ? escapeHtml(params.ipAddress) : 'Network IP recorded';
  const safeDevice = params.deviceSummary ? escapeHtml(params.deviceSummary) : 'Web Client Session';
  const safeSecurityUrl = escapeHtml(params.securityUrl);
  const safeId = escapeHtml(params.correlationId);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Security Notification: Successful Sign-in to VIZRA</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .container-table { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; -webkit-font-smoothing: antialiased;">
  <!-- Email Wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <!-- Card Container -->
        <table role="presentation" class="container-table" border="0" cellpadding="0" cellspacing="0" width="580" style="width: 580px; max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e5e5ea;">
          
          <!-- BRAND HEADER: Obsidian Titanium + VIZRA Red Prismatic Accent -->
          <tr>
            <td style="background-color: #0c0c0e; padding: 30px 40px; border-bottom: 2px solid #eb3b2d;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <!-- Brand Monogram & Wordmark -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 28px; height: 28px; background-color: #eb3b2d; border-radius: 4px; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 15px; font-weight: 800; font-family: -apple-system, sans-serif; line-height: 28px; display: inline-block;">V</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;">VIZRA</span>
                          <span style="color: #8e8e93; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; margin-left: 8px;">SECURITY</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(235, 59, 45, 0.12); border: 1px solid rgba(235, 59, 45, 0.35); border-radius: 4px; color: #ff5e52; font-size: 11px; font-family: ui-monospace, Menlo, Consolas, monospace; letter-spacing: 0.05em; font-weight: 600;">
                      ID: ${safeId.slice(0, 8)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY CONTENT -->
          <tr>
            <td class="mobile-padding" style="padding: 38px 40px 32px 40px; background-color: #ffffff;">
              <!-- Headline -->
              <h1 style="margin: 0 0 10px 0; color: #111113; font-size: 22px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em;">
                A sign-in to your VIZRA account
              </h1>
              <p style="margin: 0 0 28px 0; color: #44444a; font-size: 15px; line-height: 1.55;">
                We detected a successful sign-in to your VIZRA Creative Studio account. If this was you, no action is needed.
              </p>

              <!-- SECURITY STATUS PANEL -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafc; border-radius: 8px; border: 1px solid #e5e5ea; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <!-- Panel Title Row -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 16px; border-bottom: 1px solid #ededf2; padding-bottom: 12px;">
                      <tr>
                        <td align="left">
                          <span style="color: #111113; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">
                            Authentication Event Details
                          </span>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background-color: #34c759; margin-right: 6px; vertical-align: middle;"></span>
                          <span style="color: #248a3d; font-size: 12px; font-weight: 600; vertical-align: middle;">Verified Success</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Details Rows -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; color: #8e8e93; font-size: 13px; width: 120px;">Account</td>
                        <td style="padding: 6px 0; color: #111113; font-size: 13px; font-weight: 600;">${safeMaskedEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #8e8e93; font-size: 13px;">Date &amp; Time</td>
                        <td style="padding: 6px 0; color: #111113; font-size: 13px; font-weight: 500;">
                          ${safeTime} <span style="color: #8e8e93;">(${safeTz})</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #8e8e93; font-size: 13px;">Client Interface</td>
                        <td style="padding: 6px 0; color: #111113; font-size: 13px; font-weight: 500;">${safeDevice}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #8e8e93; font-size: 13px;">Approx. Location</td>
                        <td style="padding: 6px 0; color: #111113; font-size: 13px; font-weight: 500;">
                          ${safeIp}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CALL TO ACTION (SECURITY ACTION BUTTON) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                <tr>
                  <td align="left">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 6px; background-color: #111113;">
                          <a href="${safeSecurityUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, sans-serif; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 600; letter-spacing: 0.02em; border: 1px solid #111113; border-radius: 6px;">
                            Review Account Security &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SECURITY NOTICE / UNRECOGNIZED SIGN-IN ADVICE -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff8f7; border-left: 3px solid #eb3b2d; border-radius: 4px; padding: 14px 18px; margin-bottom: 8px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #731e17; font-size: 13px; line-height: 1.5;">
                      <strong>Don't recognize this sign-in?</strong> If you did not sign in recently, someone else may have gained access to your Google account. Please immediately review your account activity and change your credentials.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- SOPHISTICATED FOOTER -->
          <tr>
            <td class="mobile-padding" style="background-color: #fafafc; padding: 26px 40px; border-top: 1px solid #ededf2; text-align: left;">
              <p style="margin: 0 0 8px 0; color: #8e8e93; font-size: 12px; line-height: 1.5;">
                This automated security notification was delivered to <strong>${safeMaskedEmail}</strong> regarding your VIZRA AI Studio account.
              </p>
              <p style="margin: 0; color: #aeaeb2; font-size: 11px; line-height: 1.5; font-family: ui-monospace, Menlo, Consolas, monospace;">
                Event Reference: ${safeId} &bull; Security Protocol: OAuth 2.0 / Firebase Token Verified
              </p>
              <p style="margin: 12px 0 0 0; color: #aeaeb2; font-size: 11px;">
                &copy; ${new Date().getFullYear()} VIZRA AI Creative Studio. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderUserLoginEmailText(params: UserLoginNotificationParams): string {
  const masked = maskEmail(params.email);
  return `VIZRA SECURITY — SUCCESSFUL SIGN-IN NOTIFICATION
=========================================================

Hello,

A successful sign-in to your VIZRA account was recorded:

- Account: ${masked}
- Date & Time: ${params.loginTime} (${params.timezone})
- Client Interface: ${params.deviceSummary || 'Web Client Session'}
- Network/IP: ${params.ipAddress || 'Network IP recorded'}
- Event Reference ID: ${params.correlationId}

If this was you, no further action is required.

DON'T RECOGNIZE THIS SIGN-IN?
If you did not sign in recently, please secure your credentials immediately by visiting:
${params.securityUrl}

---------------------------------------------------------
(c) ${new Date().getFullYear()} VIZRA AI Creative Studio. Security Protocol: OAuth 2.0 / Verified.
`;
}

// ============================================================================
// 2. ADMIN EMAIL VARIANT: HIGH-DENSITY AUDIT & INCIDENT LOG
// ============================================================================

export function renderAdminLoginEmailHtml(params: AdminLoginNotificationParams): string {
  const safeUserEmail = escapeHtml(params.userEmail);
  const safeUserId = escapeHtml(params.userId);
  const safeTime = escapeHtml(params.loginTime);
  const safeTz = escapeHtml(params.timezone);
  const safeIp = params.ipAddress ? escapeHtml(params.ipAddress) : 'Recorded by server gateway';
  const safeUserAgent = params.userAgent ? escapeHtml(params.userAgent.slice(0, 180)) : 'Standard browser client';
  const safeDevice = params.deviceSummary ? escapeHtml(params.deviceSummary) : 'Desktop / Mobile Web';
  const safeId = escapeHtml(params.correlationId);
  const safeProvider = escapeHtml(params.authProvider);
  const safeDashboardUrl = escapeHtml(params.adminDashboardUrl);
  const safeStatus = escapeHtml(params.deliveryStatus);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VIZRA Security Alert: User Authentication Audit</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #0d0d10; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .container-table { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0d10; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0d0d10; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="container-table" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; background-color: #141418; border-radius: 12px; overflow: hidden; border: 1px solid #27272f; box-shadow: 0 8px 32px rgba(0,0,0,0.45);">
          
          <!-- ADMIN HEADER: Dark Titanium + Dual Red/Green Audit Pulse -->
          <tr>
            <td style="background-color: #09090b; padding: 28px 36px; border-bottom: 2px solid #eb3b2d;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 24px; height: 24px; background-color: #eb3b2d; border-radius: 4px; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 13px; font-weight: 800; font-family: -apple-system, sans-serif; line-height: 24px; display: inline-block;">V</span>
                        </td>
                        <td style="padding-left: 10px;">
                          <span style="color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;">VIZRA OPS</span>
                          <span style="color: #a1a1aa; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin-left: 6px;">&bull; SECURITY TELEMETRY</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 4px 8px; background-color: rgba(52, 199, 89, 0.15); border: 1px solid rgba(52, 199, 89, 0.4); border-radius: 4px; color: #4ade80; font-size: 11px; font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 600;">
                      PRIORITY: P3_AUDIT
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- AUDIT DETAILS -->
          <tr>
            <td class="mobile-padding" style="padding: 34px 36px 28px 36px; background-color: #141418;">
              <h1 style="margin: 0 0 8px 0; color: #f4f4f5; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">
                User Authentication Event Logged
              </h1>
              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 14px; line-height: 1.5;">
                A cryptographic signature validation confirmed a successful user sign-in to the VIZRA platform. Delivery audit record generated.
              </p>

              <!-- HIGH-DENSITY AUDIT TABLE -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a22; border-radius: 8px; border: 1px solid #2e2e38; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; width: 140px;">Correlation ID</td>
                        <td style="padding: 6px 0; color: #e4e4e7; font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace; font-weight: 600;">${safeId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">User Account</td>
                        <td style="padding: 6px 0; color: #ffffff; font-size: 13px; font-weight: 600;">${safeUserEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">User UID</td>
                        <td style="padding: 6px 0; color: #e4e4e7; font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace;">${safeUserId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Timestamp</td>
                        <td style="padding: 6px 0; color: #e4e4e7; font-size: 12px;">${safeTime} (${safeTz})</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Provider</td>
                        <td style="padding: 6px 0; color: #e4e4e7; font-size: 12px;">${safeProvider}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Client IP</td>
                        <td style="padding: 6px 0; color: #e4e4e7; font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace;">${safeIp}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Device / Agent</td>
                        <td style="padding: 6px 0; color: #a1a1aa; font-size: 12px; line-height: 1.4;">${safeDevice} &bull; <span style="font-size: 11px;">${safeUserAgent}</span></td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">User Email Status</td>
                        <td style="padding: 6px 0; color: #4ade80; font-size: 12px; font-weight: 600;">${safeStatus}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ADMIN ACTIONS -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius: 6px; background-color: #27272f;">
                          <a href="${safeDashboardUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 600; letter-spacing: 0.02em;">
                            Open System Telemetry &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ADMIN FOOTER -->
          <tr>
            <td class="mobile-padding" style="background-color: #09090b; padding: 22px 36px; border-top: 1px solid #1f1f26; text-align: left;">
              <p style="margin: 0; color: #71717a; font-size: 11px; line-height: 1.5; font-family: ui-monospace, Menlo, Consolas, monospace;">
                CONFIDENTIAL &bull; SYSTEM SECURITY AUDIT &bull; IDEMPOTENCY KEY: auth_${safeUserId}_verified
              </p>
              <p style="margin: 6px 0 0 0; color: #52525b; font-size: 11px;">
                Delivered automatically to configured platform security officer. Do not forward.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderAdminLoginEmailText(params: AdminLoginNotificationParams): string {
  return `[VIZRA SECURITY AUDIT] USER AUTHENTICATION EVENT
=============================================================
Correlation ID : ${params.correlationId}
User Account   : ${params.userEmail}
User UID       : ${params.userId}
Timestamp      : ${params.loginTime} (${params.timezone})
Provider       : ${params.authProvider}
Client IP      : ${params.ipAddress || 'Not recorded'}
Device/Agent   : ${params.deviceSummary || 'Web'} (${params.userAgent || 'Standard'})
Delivery Status: ${params.deliveryStatus}

System Telemetry Dashboard: ${params.adminDashboardUrl}
=============================================================
CONFIDENTIAL. VIZRA AI CREATIVE STUDIO SECURITY DISPATCH.
`;
}
