import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import logger from "logger";

// Email provider type
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "smtp"; // 'smtp' or 'resend'

// Log configuration on startup
logger.info(`Email provider configured: ${EMAIL_PROVIDER}`);
logger.info(
  `Email from address: ${process.env.EMAIL_FROM || "noreply@tomoacademy.site"}`,
);
logger.info(`Resend API key configured: ${!!process.env.RESEND_API_KEY}`);

// Resend configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && RESEND_API_KEY) {
    console.log('[RESEND] Initializing Resend client with API key:', RESEND_API_KEY.substring(0, 10) + '...');
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

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@tomoacademy.site";
const EMAIL_FROM_WITH_NAME = `TOMO <${EMAIL_FROM}>`;
const BASE_URL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:3000";

// Helper function to generate email header with logo
function getEmailHeader(title: string): string {
  return `
    <div class="header">
      <div class="logo">
        <img src="${BASE_URL}/aj-logo.jpg" alt="TOMO Logo" />
      </div>
      <h1>${title}</h1>
    </div>
  `;
}

// Helper function to generate user profile section
function getUserProfile(userName?: string, userImage?: string): string {
  if (!userName && !userImage) return '';
  
  return `
    <div class="user-profile">
      ${userImage ? `<img src="${userImage}" alt="${userName || 'User'}" />` : ''}
      ${userName ? `<div class="user-name">${userName}</div>` : ''}
    </div>
  `;
}

// Helper function to get location from IP and generate map
async function getLocationFromIP(ipAddress: string): Promise<{ city?: string; country?: string; lat?: number; lon?: number; location?: string }> {
  try {
    // Use ip-api.com free geolocation API (no key required)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city,lat,lon`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        city: data.city,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
        location: `${data.city}, ${data.country}`,
      };
    }
  } catch (error) {
    logger.error('Failed to get location from IP:', error);
  }
  return {};
}

// Helper function to generate Google Maps static image URL
function getMapImageUrl(lat: number, lon: number, location: string): string {
  // Google Maps Static API - requires API key for production
  // For now, use OpenStreetMap static map (free, no API key)
  const zoom = 12;
  const width = 500;
  const height = 300;
  
  // Using StaticMapMaker.com free service
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lon}&key=${process.env.GOOGLE_MAPS_API_KEY || ''}`;
}

// Helper function to generate location map section
function getLocationMapSection(lat?: number, lon?: number, location?: string): string {
  if (!lat || !lon || !location) return '';
  
  const mapUrl = getMapImageUrl(lat, lon, location);
  
  return `
    <div class="location-map">
      <p style="color: #666; margin-bottom: 10px;"><strong>📍 Login Location:</strong> ${location}</p>
      <img src="${mapUrl}" alt="Login location map: ${location}" />
    </div>
  `;
}

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

// Email templates with ChatGPT-inspired premium design
const emailStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #2d3748;
    background-color: #f7f7f8;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    border: 1px solid #e5e5e5;
  }
  .header {
    background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
    padding: 40px 30px;
    text-align: center;
    border-bottom: 1px solid #e5e5e5;
  }
  .header .logo {
    margin-bottom: 24px;
  }
  .header .logo img {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #f7f7f8;
    padding: 4px;
    border: 2px solid #e5e5e5;
  }
  .header h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: -0.5px;
  }
  .user-profile {
    text-align: center;
    margin: 24px 0;
  }
  .user-profile img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #e5e5e5;
    object-fit: cover;
  }
  .user-profile .user-name {
    margin-top: 12px;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .location-map {
    margin: 24px 0;
    text-align: center;
  }
  .location-map img {
    width: 100%;
    max-width: 500px;
    border-radius: 8px;
    border: 1px solid #e5e5e5;
  }
  .content {
    padding: 40px 32px;
  }
  .content h2 {
    color: #1a1a1a;
    font-size: 22px;
    margin: 0 0 20px 0;
    font-weight: 600;
    letter-spacing: -0.3px;
  }
  .content p {
    color: #6b7280;
    font-size: 15px;
    margin: 0 0 20px 0;
    line-height: 1.7;
  }
  .button {
    display: inline-block;
    padding: 14px 28px;
    background: #10a37f;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 15px;
    margin: 24px 0;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(16, 163, 127, 0.2);
  }
  .button:hover {
    background: #0d8f6f;
    box-shadow: 0 2px 6px rgba(16, 163, 127, 0.3);
  }
  .code-box {
    background-color: #f7f7f8;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 20px;
    margin: 24px 0;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    color: #1a1a1a;
    letter-spacing: 6px;
  }
  .footer {
    padding: 32px;
    text-align: center;
    background-color: #fafafa;
    border-top: 1px solid #e5e5e5;
  }
  .footer p {
    margin: 5px 0;
    color: #9ca3af;
    font-size: 13px;
  }
  .footer a {
    color: #10a37f;
    text-decoration: none;
    font-weight: 500;
  }
  .divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e5e5e5, transparent);
    margin: 32px 0;
  }
  .info-box {
    background-color: #f0fdf4;
    border-left: 3px solid #10a37f;
    padding: 16px 20px;
    margin: 24px 0;
    border-radius: 6px;
  }
  .info-box p {
    margin: 0;
    color: #059669;
    font-size: 14px;
    line-height: 1.6;
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
    logger.info(
      `Attempting to send email to ${options.to} with subject: ${options.subject}`,
    );
    logger.info(
      `Using provider: ${EMAIL_PROVIDER}, Resend API Key: ${!!RESEND_API_KEY}`,
    );

    // Use Resend if configured and selected
    if (EMAIL_PROVIDER === "resend" && RESEND_API_KEY) {
      logger.info(`Sending via Resend from ${EMAIL_FROM_WITH_NAME}`);
      const resend = getResendClient();

      logger.info(`Resend API call starting...`);
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM_WITH_NAME,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
      });

      if (error) {
        logger.error("Failed to send email via Resend:", JSON.stringify(error));
        logger.error("Error details:", error);
        console.error("RESEND ERROR FULL:", error);
        return false;
      }

      logger.info(`Email sent via Resend: ${data?.id} to ${options.to}`);
      console.log("RESEND SUCCESS:", data);
      return true;
    }

    // Fallback to SMTP
    logger.info(`Sending via SMTP from ${EMAIL_FROM}`);
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
  userImage?: string,
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
        ${getEmailHeader('📧 Verify Your Email')}
        <div class="content">
          ${getUserProfile(userName, userImage)}
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
          <p>Sent with ❤️ from TOMO</p>
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
  userImage?: string,
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
        ${getEmailHeader('🎉 Welcome Aboard!')}
        <div class="content">
          ${getUserProfile(userName, userImage)}
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
  userImage?: string,
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
        ${getEmailHeader('🔑 Reset Your Password')}
        <div class="content">
          ${getUserProfile(userName, userImage)}
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
    userImage?: string;
  },
): Promise<boolean> {
  const timestamp = loginDetails?.timestamp || new Date();
  
  // Get location data from IP address
  let locationData: { city?: string; country?: string; lat?: number; lon?: number; location?: string } = {};
  if (loginDetails?.ipAddress && loginDetails.ipAddress !== 'Unknown') {
    locationData = await getLocationFromIP(loginDetails.ipAddress);
  }
  
  // Use fetched location or fallback to provided location
  const finalLocation = locationData.location || loginDetails?.location;

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
        ${getEmailHeader('🔐 New Login Detected')}
        <div class="content">
          ${getUserProfile(userName, loginDetails?.userImage)}
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
              finalLocation
                ? `
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
              <td style="padding: 8px 0; color: #333;">${finalLocation}</td>
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
          
          ${getLocationMapSection(locationData.lat, locationData.lon, finalLocation)}
          
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
