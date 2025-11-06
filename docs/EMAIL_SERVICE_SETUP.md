# Email Service Setup Guide

This project includes a comprehensive email service for authentication flows (registration, login verification, password reset, etc.) using **nodemailer** with SMTP.

## 📧 Features

- ✅ **Email Verification** - Sent on user registration
- ✅ **Welcome Emails** - Sent after successful verification
- ✅ **Password Reset** - Secure token-based password recovery
- ✅ **Email Change Verification** - Confirm new email addresses
- ✅ **Login Notifications** - Optional security alerts (can be enabled)
- 🎨 **Modern Email Templates** - Professional, responsive design similar to xAI, Vercel, Linear

## 🚀 Quick Start

### 1. Configure Environment Variables

Add these variables to your `.env` file:

**Option A: Resend (Recommended - Easiest)**
```bash
# Choose Resend as provider
EMAIL_PROVIDER=resend

# Get API key from https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@ajstudioz.co.in
```

**Option B: SMTP (Gmail, SendGrid, etc.)**
```bash
# Choose SMTP as provider
EMAIL_PROVIDER=smtp

# === Email Service (SMTP) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 2. Choose Your Email Provider

#### Option A: Resend (⭐ Recommended)

**Why Resend?**
- ✅ Easiest setup - just one API key
- ✅ Works across multiple projects with same domain
- ✅ 3,000 free emails per month
- ✅ Great dashboard and analytics
- ✅ Faster and more reliable than SMTP

**Setup:**

1. Go to [Resend](https://resend.com/) and sign in
2. Get your API key from: https://resend.com/api-keys
3. Add to `.env`:
   ```bash
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

**🎉 That's it!** If your domain is already verified with Resend (from another project), it will work immediately!

See detailed guide: [Resend Setup with ajstudioz.co.in](./RESEND_SETUP.md)

---

#### Option B: Gmail (For Testing)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Select "2-Step Verification" → "App passwords"
   - Generate a new app password for "Mail"
3. Use these settings:
   ```bash
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

#### Option C: SendGrid (Production)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key in Settings → API Keys
3. Use these settings:
   ```bash
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   EMAIL_FROM=noreply@yourdomain.com
   ```

#### Option D: AWS SES (Best for Scale)

1. Verify your domain in AWS SES console
2. Create SMTP credentials
3. Use these settings:
   ```bash
   EMAIL_PROVIDER=smtp
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   EMAIL_FROM=noreply@yourdomain.com
   ```

#### Option E: Ethereal Email (Testing Only)

For local development testing without real email delivery:

1. Go to [Ethereal Email](https://ethereal.email/)
2. Click "Create Ethereal Account"
3. Use the provided credentials:
   ```bash
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=generated-username@ethereal.email
   SMTP_PASS=generated-password
   EMAIL_FROM=test@ethereal.email
   ```
4. View sent emails at the Ethereal inbox URL provided

## 📝 Email Templates

All email templates are located in `src/lib/mailer.ts` and include:

### 1. Verification Email
Sent automatically when a user signs up with email/password.

**Trigger:** User registration with email  
**Action:** User clicks verification link → Account activated

### 2. Welcome Email
Sent after successful email verification.

**Trigger:** Email verification completed  
**Action:** Welcome message with getting started tips

### 3. Password Reset Email
Sent when user requests password reset.

**Trigger:** User clicks "Forgot Password"  
**Action:** User clicks reset link → Sets new password

### 4. Email Change Verification
Sent when user changes their email address.

**Trigger:** User updates email in settings  
**Action:** User verifies new email → Email changed

### 5. Login Notification (Optional)
Security feature to notify users of new logins.

**Trigger:** User logs in from new device/location  
**Action:** User can secure account if unauthorized

## 🧪 Testing

### Test SMTP Connection

Create a test script or use the built-in connection test:

```typescript
import { testEmailConnection } from "@/lib/mailer";

async function test() {
  const success = await testEmailConnection();
  console.log(success ? "✅ Connected!" : "❌ Connection failed");
}

test();
```

### Manual Email Test

You can manually trigger test emails:

```typescript
import { sendVerificationEmail } from "@/lib/mailer";

await sendVerificationEmail(
  "test@example.com",
  "test-token-123",
  "Test User"
);
```

### View Sent Emails

- **Ethereal Email**: Check the preview URL in logs
- **Gmail**: Check Sent folder
- **SendGrid**: Check Activity Feed in dashboard
- **AWS SES**: Check sending statistics

## 🔧 Customization

### Modify Email Templates

Edit templates in `src/lib/mailer.ts`:

```typescript
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  userName?: string,
): Promise<boolean> {
  // Customize HTML template here
  const html = `...`;
  
  return sendEmail({
    to: email,
    subject: "Your custom subject",
    html,
  });
}
```

### Change Email Styles

Modify the `emailStyles` constant in `src/lib/mailer.ts` to customize colors, fonts, and layout.

### Add New Email Types

1. Create a new function in `src/lib/mailer.ts`:
   ```typescript
   export async function sendCustomEmail(email: string): Promise<boolean> {
     const html = `...`;
     return sendEmail({ to: email, subject: "...", html });
   }
   ```

2. Import and use in your API routes or hooks:
   ```typescript
   import { sendCustomEmail } from "@/lib/mailer";
   await sendCustomEmail("user@example.com");
   ```

## 🔐 Security Best Practices

1. **Use App Passwords**: Never use your main Gmail password
2. **Environment Variables**: Keep SMTP credentials in `.env` (never commit)
3. **Rate Limiting**: Consider adding rate limits to prevent abuse
4. **SPF/DKIM/DMARC**: Configure for production domains
5. **Token Expiration**: Verification tokens expire in 24 hours
6. **HTTPS Only**: Use HTTPS in production for secure links

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check logs**: Look for error messages in console
2. **Verify credentials**: Test SMTP connection
3. **Firewall**: Ensure port 587 is not blocked
4. **Gmail**: Enable "Less secure app access" if using old account
5. **Rate limits**: Check if provider rate limits exceeded

### Emails Going to Spam

1. **Verify domain**: Set up SPF, DKIM, DMARC records
2. **Use professional email**: Avoid generic "noreply@gmail.com"
3. **Warm up domain**: Start with low volume, increase gradually
4. **Content**: Avoid spam trigger words in subject/body

### Links Not Working

1. **Check BASE_URL**: Ensure `BETTER_AUTH_URL` or `NEXT_PUBLIC_BASE_URL` is set
2. **HTTPS**: Use HTTPS in production
3. **Token expiration**: Tokens expire after 24 hours
4. **URL encoding**: Ensure tokens are properly encoded

## 📊 Monitoring

### Log Email Activity

All email sends are logged with:
- Recipient email
- Message ID
- Success/failure status
- Preview URLs (for Ethereal)

Check your application logs for email activity:

```bash
pnpm dev
# Look for: "Email sent: <message-id> to <email>"
```

### Provider Dashboards

- **SendGrid**: View delivery rates, bounces, spam reports
- **AWS SES**: Monitor sending statistics, reputation
- **Gmail**: Check sent folder and bounce notifications

## 🚀 Production Deployment

### Vercel

Add environment variables in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add all `SMTP_*` and `EMAIL_FROM` variables
3. Redeploy

### Docker

Mount `.env` file or pass environment variables:

```bash
docker run -e SMTP_HOST=smtp.sendgrid.net \
           -e SMTP_PORT=587 \
           -e SMTP_USER=apikey \
           -e SMTP_PASS=your-key \
           -e EMAIL_FROM=noreply@yourdomain.com \
           your-image
```

### Self-Hosted

Ensure firewall allows outbound SMTP (port 587):

```bash
# Ubuntu/Debian
sudo ufw allow out 587/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --reload
```

## 📚 Further Reading

- [Nodemailer Documentation](https://nodemailer.com/)
- [Better Auth Email Verification](https://www.better-auth.com/docs/plugins/email-verification)
- [SendGrid SMTP Guide](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [AWS SES SMTP Setup](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review application logs for error messages
3. Test SMTP connection with `testEmailConnection()`
4. Verify environment variables are set correctly
5. Check provider-specific documentation

---

**Need help?** Open an issue or check the [Better Auth Discord](https://discord.gg/better-auth) community.
