/**
 * Email Service Test Script
 *
 * This script tests the email service configuration and sends test emails.
 *
 * Usage:
 *   pnpm tsx scripts/test-email.ts
 *
 * Make sure you have configured SMTP settings in .env first:
 *   - SMTP_HOST
 *   - SMTP_PORT
 *   - SMTP_USER
 *   - SMTP_PASS
 *   - EMAIL_FROM
 */

import {
  testEmailConnection,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendLoginNotificationEmail,
  sendEmailChangeVerification,
} from "../src/lib/mailer";
import logger from "../src/lib/logger";

async function runTests() {
  logger.info("🚀 Starting Email Service Tests...\n");

  // Test 1: Connection Test
  logger.info("1️⃣ Testing SMTP connection...");
  const connectionSuccess = await testEmailConnection();

  if (!connectionSuccess) {
    logger.error(
      "❌ SMTP connection failed. Please check your .env configuration.",
    );
    logger.error(
      "Required variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM",
    );
    process.exit(1);
  }

  logger.info("✅ SMTP connection successful!\n");

  // Get test email from command line or use default
  const testEmail =
    process.argv[2] || process.env.SMTP_USER || "test@example.com";

  if (!testEmail) {
    logger.error("❌ Please provide a test email address:");
    logger.error("   pnpm tsx scripts/test-email.ts your-email@example.com");
    process.exit(1);
  }

  logger.info(`📧 Sending test emails to: ${testEmail}\n`);

  // Test 2: Verification Email
  logger.info("2️⃣ Testing verification email...");
  const verificationSuccess = await sendVerificationEmail(
    testEmail,
    "test-verification-token-12345",
    "Test User",
  );

  if (verificationSuccess) {
    logger.info("✅ Verification email sent successfully!\n");
  } else {
    logger.error("❌ Failed to send verification email\n");
  }

  // Wait a bit between emails
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 3: Welcome Email
  logger.info("3️⃣ Testing welcome email...");
  const welcomeSuccess = await sendWelcomeEmail(testEmail, "Test User");

  if (welcomeSuccess) {
    logger.info("✅ Welcome email sent successfully!\n");
  } else {
    logger.error("❌ Failed to send welcome email\n");
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 4: Password Reset Email
  logger.info("4️⃣ Testing password reset email...");
  const resetSuccess = await sendPasswordResetEmail(
    testEmail,
    "test-reset-token-67890",
    "Test User",
  );

  if (resetSuccess) {
    logger.info("✅ Password reset email sent successfully!\n");
  } else {
    logger.error("❌ Failed to send password reset email\n");
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 5: Email Change Verification
  logger.info("5️⃣ Testing email change verification...");
  const emailChangeSuccess = await sendEmailChangeVerification(
    testEmail,
    "test-email-change-token-11111",
    "Test User",
  );

  if (emailChangeSuccess) {
    logger.info("✅ Email change verification sent successfully!\n");
  } else {
    logger.error("❌ Failed to send email change verification\n");
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test 6: Login Notification
  logger.info("6️⃣ Testing login notification email...");
  const loginNotificationSuccess = await sendLoginNotificationEmail(
    testEmail,
    "Test User",
    {
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      location: "New York, USA",
      timestamp: new Date(),
    },
  );

  if (loginNotificationSuccess) {
    logger.info("✅ Login notification email sent successfully!\n");
  } else {
    logger.error("❌ Failed to send login notification email\n");
  }

  // Summary
  logger.info("\n" + "=".repeat(60));
  logger.info("📊 Test Summary:");
  logger.info("=".repeat(60));
  logger.info(`✅ SMTP Connection: ${connectionSuccess ? "PASSED" : "FAILED"}`);
  logger.info(
    `✅ Verification Email: ${verificationSuccess ? "PASSED" : "FAILED"}`,
  );
  logger.info(`✅ Welcome Email: ${welcomeSuccess ? "PASSED" : "FAILED"}`);
  logger.info(`✅ Password Reset: ${resetSuccess ? "PASSED" : "FAILED"}`);
  logger.info(`✅ Email Change: ${emailChangeSuccess ? "PASSED" : "FAILED"}`);
  logger.info(
    `✅ Login Notification: ${loginNotificationSuccess ? "PASSED" : "FAILED"}`,
  );
  logger.info("=".repeat(60));

  const totalTests = 6;
  const passedTests = [
    connectionSuccess,
    verificationSuccess,
    welcomeSuccess,
    resetSuccess,
    emailChangeSuccess,
    loginNotificationSuccess,
  ].filter(Boolean).length;

  logger.info(`\n✨ ${passedTests}/${totalTests} tests passed!\n`);

  if (passedTests === totalTests) {
    logger.info(
      "🎉 All tests passed! Your email service is working correctly.",
    );

    // Check if using ethereal.email
    if (process.env.SMTP_HOST?.includes("ethereal")) {
      logger.info("\n📬 Using Ethereal Email for testing.");
      logger.info(
        "📧 Check the console logs above for preview URLs to view the emails.",
      );
    }
  } else {
    logger.error("⚠️ Some tests failed. Please check the error messages above.");
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logger.error("Fatal error during email tests:", error);
  process.exit(1);
});
