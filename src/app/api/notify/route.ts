import { NextResponse } from 'next/server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(request: Request) {
  try {
    const { title, message, severity, emailTo } = await request.json();
    
    // Check if Resend API key is configured
    const hasResendKey = process.env.RESEND_API_KEY;

    if (hasResendKey) {
      // Important: Resend free tier requires you to use 'onboarding@resend.dev' as the from address
      // and can only send to your verified email address until you verify a custom domain.
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: emailTo || 'your_email@example.com', // To test properly, the user should provide their verified email
        subject: `[${severity.toUpperCase()}] ${title}`,
        html: `<p><strong>Alert:</strong> ${title}</p><p>${message}</p>`,
      });
    }

    // Return success to indicate the simulated (or real) email was sent successfully
    return NextResponse.json({ 
      success: true, 
      simulated: !hasResendKey,
      message: 'Notification processed' 
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
  }
}
