import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Target recipient email (defaults to Super Admin email or admin notification recipient)
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'moosashahid0320@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      type = 'alert', // 'alert' | 'user_signup' | 'cpu_spike' | 'custom'
      title, 
      message, 
      severity = 'info', 
      emailTo = DEFAULT_ADMIN_EMAIL,
      metadata = {} 
    } = body;

    if (!title && !message) {
      return NextResponse.json({ success: false, error: 'Missing title or message' }, { status: 400 });
    }

    const hasResend = Boolean(resendApiKey && resend);

    if (hasResend && resend) {
      const subjectTag = type === 'user_signup' 
        ? '[ASRMS User Sign-up]' 
        : `[ASRMS ${severity.toUpperCase()} ALERT]`;

      const formattedSubject = `${subjectTag} ${title || 'System Notification'}`;

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b1329; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
          <div style="padding: 24px; background: linear-gradient(135deg, #1e1b4b, #0f172a); border-bottom: 1px solid #334155;">
            <div style="font-size: 13px; font-weight: 700; color: #818cf8; letter-spacing: 0.05em; text-transform: uppercase;">ASRMS Cloud Platform</div>
            <h1 style="margin: 8px 0 0; font-size: 20px; color: #ffffff; font-weight: 700;">${title}</h1>
          </div>
          
          <div style="padding: 24px;">
            <div style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; 
              ${severity === 'critical' ? 'background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);' : 
                severity === 'warning' ? 'background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4);' : 
                'background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);'}">
              Severity: ${severity}
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">
              ${message}
            </p>

            ${metadata && Object.keys(metadata).length > 0 ? `
              <div style="margin-top: 20px; padding: 14px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;">
                <div style="font-size: 12px; color: #94a3b8; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Event Details</div>
                <table style="width: 100%; font-size: 13px; color: #e2e8f0; border-collapse: collapse;">
                  ${Object.entries(metadata).map(([k, v]) => `
                    <tr>
                      <td style="padding: 4px 0; color: #94a3b8; width: 40%; font-family: monospace;">${k}:</td>
                      <td style="padding: 4px 0; font-weight: 500;">${String(v)}</td>
                    </tr>
                  `).join('')}
                </table>
              </div>
            ` : ''}

            <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center;">
              This is an automated alert from your ASRMS Auto-Scaling & Resource Monitoring System.
            </div>
          </div>
        </div>
      `;

      // On Resend free tier, 'onboarding@resend.dev' can send to the account holder email
      const sendResult = await resend.emails.send({
        from: 'ASRMS Alerts <onboarding@resend.dev>',
        to: [emailTo],
        subject: formattedSubject,
        html: htmlContent,
      });

      return NextResponse.json({
        success: true,
        provider: 'Resend (Live)',
        id: sendResult.data?.id,
        recipient: emailTo,
        message: 'Real email notification dispatched successfully.'
      });
    }

    return NextResponse.json({
      success: true,
      provider: 'Simulated',
      recipient: emailTo,
      message: 'Notification processed (Simulation mode - set RESEND_API_KEY for live delivery).'
    });
  } catch (error: any) {
    console.error('[Resend Error]:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to dispatch email' 
    }, { status: 500 });
  }
}
