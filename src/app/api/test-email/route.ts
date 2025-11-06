import { NextRequest, NextResponse } from "next/server";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendLoginNotificationEmail,
  testEmailConnection,
} from "@/lib/mailer";
import logger from "@/lib/logger";

/**
 * Test Email API Endpoint
 *
 * Usage:
 * GET /api/test-email?to=your-email@example.com&type=verification
 *
 * Query Parameters:
 * - to: Email address to send test email to (required)
 * - type: Type of email to test (optional, default: all)
 *   Options: verification, welcome, reset, login, all
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toEmail = searchParams.get("to");
    const emailType = searchParams.get("type") || "all";

    // Validate email parameter
    if (!toEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing 'to' parameter. Usage: /api/test-email?to=your-email@example.com",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }

    logger.info(`Testing email service for ${toEmail}, type: ${emailType}`);

    const results: Record<string, boolean> = {};

    // Test connection first
    logger.info("Testing email connection...");
    const connectionSuccess = await testEmailConnection();
    results.connection = connectionSuccess;

    if (!connectionSuccess) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email connection failed. Check your SMTP/Resend configuration.",
          results,
        },
        { status: 500 },
      );
    }

    // Send test emails based on type
    if (emailType === "all" || emailType === "verification") {
      logger.info("Sending verification email...");
      results.verification = await sendVerificationEmail(
        toEmail,
        "test-verification-token-123",
        "Test User",
      );
    }

    if (emailType === "all" || emailType === "welcome") {
      logger.info("Sending welcome email...");
      results.welcome = await sendWelcomeEmail(toEmail, "Test User");
    }

    if (emailType === "all" || emailType === "reset") {
      logger.info("Sending password reset email...");
      results.reset = await sendPasswordResetEmail(
        toEmail,
        "test-reset-token-456",
        "Test User",
      );
    }

    if (emailType === "all" || emailType === "login") {
      logger.info("Sending login notification email...");
      results.login = await sendLoginNotificationEmail(toEmail, "Test User", {
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "Unknown",
        location: "Test Location",
        timestamp: new Date(),
      });
    }

    // Check if all emails were sent successfully
    const allSuccess = Object.values(results).every((v) => v === true);

    return NextResponse.json(
      {
        success: allSuccess,
        message: allSuccess
          ? `All test emails sent successfully to ${toEmail}!`
          : `Some emails failed to send to ${toEmail}`,
        results,
        info: {
          recipient: toEmail,
          emailType,
          provider: process.env.EMAIL_PROVIDER || "smtp",
          from: process.env.EMAIL_FROM || "noreply@example.com",
        },
      },
      { status: allSuccess ? 200 : 500 },
    );
  } catch (error) {
    logger.error("Error in test-email endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST endpoint for testing email with custom data
 *
 * Body:
 * {
 *   "to": "your-email@example.com",
 *   "type": "verification",
 *   "userName": "John Doe"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type = "all", userName = "Test User" } = body;

    // Validate email parameter
    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing 'to' field in request body",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }

    logger.info(`Testing email service for ${to}, type: ${type}`);

    const results: Record<string, boolean> = {};

    // Test connection
    results.connection = await testEmailConnection();

    if (!results.connection) {
      return NextResponse.json(
        {
          success: false,
          error: "Email connection failed. Check your configuration.",
          results,
        },
        { status: 500 },
      );
    }

    // Send test emails
    if (type === "all" || type === "verification") {
      results.verification = await sendVerificationEmail(
        to,
        "test-verification-token-123",
        userName,
      );
    }

    if (type === "all" || type === "welcome") {
      results.welcome = await sendWelcomeEmail(to, userName);
    }

    if (type === "all" || type === "reset") {
      results.reset = await sendPasswordResetEmail(
        to,
        "test-reset-token-456",
        userName,
      );
    }

    if (type === "all" || type === "login") {
      results.login = await sendLoginNotificationEmail(to, userName, {
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "127.0.0.1",
        userAgent: request.headers.get("user-agent") || "Unknown",
        location: "Test Location",
        timestamp: new Date(),
      });
    }

    const allSuccess = Object.values(results).every((v) => v === true);

    return NextResponse.json(
      {
        success: allSuccess,
        message: allSuccess
          ? `All test emails sent successfully to ${to}!`
          : `Some emails failed to send to ${to}`,
        results,
        info: {
          recipient: to,
          userName,
          emailType: type,
          provider: process.env.EMAIL_PROVIDER || "smtp",
          from: process.env.EMAIL_FROM || "noreply@example.com",
        },
      },
      { status: allSuccess ? 200 : 500 },
    );
  } catch (error) {
    logger.error("Error in test-email POST endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
