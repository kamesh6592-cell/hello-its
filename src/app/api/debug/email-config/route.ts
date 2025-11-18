import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'NOT SET (defaulting to smtp)',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET ✓' : 'NOT SET ✗',
    EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET (defaulting to noreply@tomoacademy.site)',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'NOT SET',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET (defaulting to smtp.ethereal.email)',
    SMTP_USER: process.env.SMTP_USER ? 'SET ✓' : 'NOT SET ✗',
  };

  const diagnosis = {
    status: 'Configuration Check',
    config,
    issues: [] as string[],
    recommendations: [] as string[],
  };

  // Check for common issues
  if (!process.env.EMAIL_PROVIDER) {
    diagnosis.issues.push('EMAIL_PROVIDER not set - defaulting to SMTP instead of Resend');
    diagnosis.recommendations.push('Add EMAIL_PROVIDER=resend to Vercel environment variables');
  }

  if (!process.env.RESEND_API_KEY && process.env.EMAIL_PROVIDER === 'resend') {
    diagnosis.issues.push('EMAIL_PROVIDER is resend but RESEND_API_KEY is not set');
    diagnosis.recommendations.push('Add RESEND_API_KEY to Vercel environment variables');
  }

  if (!process.env.BETTER_AUTH_URL) {
    diagnosis.issues.push('BETTER_AUTH_URL not set - email links may not work correctly');
    diagnosis.recommendations.push('Add BETTER_AUTH_URL=https://chat.tomoacademy.site to Vercel');
  }

  if (!process.env.EMAIL_FROM) {
    diagnosis.issues.push('EMAIL_FROM not set - using default noreply@tomoacademy.site');
    diagnosis.recommendations.push('Add EMAIL_FROM=noreply@tomoacademy.site to Vercel (optional)');
  }

  // Check if using SMTP fallback
  if ((!process.env.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER === 'smtp') && !process.env.SMTP_USER) {
    diagnosis.issues.push('SMTP is the active provider but SMTP credentials are not configured');
    diagnosis.recommendations.push('Either set EMAIL_PROVIDER=resend OR configure SMTP credentials');
  }

  return NextResponse.json(diagnosis, { status: 200 });
}
