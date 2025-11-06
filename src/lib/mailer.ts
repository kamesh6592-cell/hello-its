import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import logger from "logger";

// Email provider type
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "smtp"; // 'smtp' or 'resend'

// Resend configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && RESEND_API_KEY) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  if (!resendClient) {
    throw new Error("Resend API key not configured");
  }
  return resendClient;
}

// SMTP configuration (fallback)
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@ajstudioz.co.in";
const BASE_URL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

// Create reusable transporter for SMTP
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
      logger.warn("SMTP credentials not configured. Emails will not be sent.");
      // Return a test transporter for development
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: "test@ethereal.email",
          pass: "test",
        },
      });
    } else {
      transporter = nodemailer.createTransport(SMTP_CONFIG);
    }
  }
  return transporter;
}

// Email templates with modern, clean design
const emailStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 20px;
    text-align: center;
    color: #ffffff;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
  .content {
    padding: 40px 30px;
  }
  .content h2 {
    color: #1a1a1a;
    font-size: 24px;
    margin: 0 0 20px 0;
    font-weight: 600;
  }
  .content p {
    color: #666;
    font-size: 16px;
    margin: 0 0 20px 0;
  }
  .button {
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
    margin: 20px 0;
    transition: transform 0.2s;
  }
  .button:hover {
    transform: translateY(-1px);
  }
  .code-box {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 16px;
    margin: 20px 0;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    color: #333;
    letter-spacing: 4px;
  }
  .footer {
    padding: 30px;
    text-align: center;
    background-color: #f8f9fa;
    border-top: 1px solid #e9ecef;
  }
  .footer p {
    margin: 5px 0;
    color: #999;
    font-size: 14px;
  }
  .footer a {
    color: #667eea;
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e9ecef, transparent);
    margin: 30px 0;
  }
  .info-box {
    background-color: #f0f7ff;
    border-left: 4px solid #667eea;
    padding: 16px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .info-box p {
    margin: 0;
    color: #1a73e8;
    font-size: 14px;
  }
`;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured email provider (Resend or SMTP)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Use Resend if configured and selected
    if (EMAIL_PROVIDER === "resend" && RESEND_API_KEY) {
      const resend = getResendClient();

      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
      });

      if (error) {
        logger.error("Failed to send email via Resend:", error);
        return false;
      }

      logger.info(`Email sent via Resend: ${data?.id} to ${options.to}`);
      return true;
    }

    // Fallback to SMTP
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    });

    logger.info(`Email sent via SMTP: ${info.messageId} to ${options.to}`);

    // Log preview URL for ethereal.email testing
    if (SMTP_CONFIG.host.includes("ethereal")) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    logger.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  verificationTokenOrUrl: string,
  userName?: string,
): Promise<boolean> {
  // If it's already a full URL, use it; otherwise build the URL
  const verificationUrl = verificationTokenOrUrl.startsWith("http")
    ? verificationTokenOrUrl
    : `${BASE_URL}/api/auth/verify-email?token=${verificationTokenOrUrl}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Welcome${userName ? `, ${userName}` : ""}! 👋</h2>
          <p>Thanks for signing up! We're excited to have you on board.</p>
          <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-box">
            <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this link into your browser:</p>
          </div>
          <p style="word-break: break-all; font-size: 14px; color: #667eea;">
            ${verificationUrl}
          </p>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #999;">
            This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>Sent with ❤️ from AJ STUDIOZ</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    html,
  });
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  userName?: string,
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome Aboard! 🎉</h1>
        </div>
        <div class="content">
          <h2>Hi${userName ? ` ${userName}` : ""}!</h2>
          <p>Your email has been verified successfully. You're all set to start using your account!</p>
          
          <p>Here are some quick tips to get you started:</p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Complete your profile to personalize your experience</li>
            <li>Explore our features and tools</li>
            <li>Check out our documentation and guides</li>
            <li>Join our community and connect with other users</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${BASE_URL}/dashboard" class="button">Go to Dashboard</a>
          </div>
          
          <div class="divider"></div>
          
          <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>Questions? <a href="${BASE_URL}/support">Contact Support</a></p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome! Your account is ready",
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetTokenOrUrl: string,
  userName?: string,
): Promise<boolean> {
  // If it's already a full URL, use it; otherwise build the URL
  const resetUrl = resetTokenOrUrl.startsWith("http")
    ? resetTokenOrUrl
    : `${BASE_URL}/reset-password?token=${resetTokenOrUrl}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hi${userName ? ` ${userName}` : ""}!</h2>
          <p>We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.</p>
          
          <p>To reset your password, click the button below:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-box">
            <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this link into your browser:</p>
          </div>
          <p style="word-break: break-all; font-size: 14px; color: #667eea;">
            ${resetUrl}
          </p>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #999;">
            This password reset link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        <div class="footer">
          <p>Need help? <a href="${BASE_URL}/support">Contact Support</a></p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your password",
    html,
  });
}

/**
 * Send login notification email (optional security feature)
 */
export async function sendLoginNotificationEmail(
  email: string,
  userName?: string,
  loginDetails?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    timestamp?: Date;
  },
): Promise<boolean> {
  const timestamp = loginDetails?.timestamp || new Date();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Login Detected</h1>
        </div>
        <div class="content">
          <h2>Hi${userName ? ` ${userName}` : ""}!</h2>
          <p>We detected a new login to your account. If this was you, you can safely ignore this email.</p>
          
          <div class="info-box">
            <p><strong>Login Details:</strong></p>
          </div>
          
          <table style="width: 100%; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Time:</strong></td>
              <td style="padding: 8px 0; color: #333;">${timestamp.toLocaleString()}</td>
            </tr>
            ${
              loginDetails?.ipAddress
                ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>IP Address:</strong></td>
              <td style="padding: 8px 0; color: #333;">${loginDetails.ipAddress}</td>
            </tr>
            `
                : ""
            }
            ${
              loginDetails?.location
                ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
              <td style="padding: 8px 0; color: #333;">${loginDetails.location}</td>
            </tr>
            `
                : ""
            }
            ${
              loginDetails?.userAgent
                ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Device:</strong></td>
              <td style="padding: 8px 0; color: #333;">${loginDetails.userAgent.slice(0, 60)}...</td>
            </tr>
            `
                : ""
            }
          </table>
          
          <div class="divider"></div>
          
          <p style="color: #d93025;"><strong>Was this not you?</strong></p>
          <p>If you didn't log in, please secure your account immediately by changing your password.</p>
          
          <div style="text-align: center;">
            <a href="${BASE_URL}/settings/security" class="button">Secure My Account</a>
          </div>
        </div>
        <div class="footer">
          <p>Questions? <a href="${BASE_URL}/support">Contact Support</a></p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "New login to your account",
    html,
  });
}

/**
 * Send email change verification
 */
export async function sendEmailChangeVerification(
  newEmail: string,
  verificationToken: string,
  userName?: string,
): Promise<boolean> {
  const verificationUrl = `${BASE_URL}/api/auth/verify-email-change?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Email Change</h1>
        </div>
        <div class="content">
          <h2>Hi${userName ? ` ${userName}` : ""}!</h2>
          <p>You recently requested to change your email address. To confirm this change, please verify your new email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify New Email</a>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-box">
            <p><strong>Alternative:</strong> If the button doesn't work, copy and paste this link into your browser:</p>
          </div>
          <p style="word-break: break-all; font-size: 14px; color: #667eea;">
            ${verificationUrl}
          </p>
          
          <div class="divider"></div>
          
          <p style="font-size: 14px; color: #999;">
            This verification link will expire in 24 hours. If you didn't request an email change, please contact support immediately.
          </p>
        </div>
        <div class="footer">
          <p>Need help? <a href="${BASE_URL}/support">Contact Support</a></p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: newEmail,
    subject: "Verify your new email address",
    html,
  });
}

// Helper function to strip HTML tags for plain text version
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Export utility for testing email configuration
export async function testEmailConnection(): Promise<boolean> {
  try {
    // Test Resend connection
    if (EMAIL_PROVIDER === "resend" && RESEND_API_KEY) {
      getResendClient(); // Initialize Resend client
      logger.info("Resend API key configured, connection ready");
      return true;
    }

    // Test SMTP connection
    const transport = getTransporter();
    await transport.verify();
    logger.info("SMTP connection verified successfully");
    return true;
  } catch (error) {
    logger.error("Email connection failed:", error);
    return false;
  }
}
