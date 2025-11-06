# Using Resend with Your Domain (ajstudioz.co.in)

## ✅ Good News!

You can use the **same Resend API key** for multiple projects! Resend allows you to send emails from the same domain across different applications.

## 🚀 Quick Setup

### Step 1: Use Your Existing Resend API Key

Since you already have `ajstudioz.co.in` configured with Resend, simply:

1. Go to your Resend dashboard: https://resend.com/api-keys
2. Copy your existing API key (or create a new one if you prefer)
3. Add it to your `.env` file:

```bash
# Choose Resend as the email provider
EMAIL_PROVIDER=resend

# Your existing Resend API key (works across multiple projects)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Your domain email address
EMAIL_FROM=noreply@ajstudioz.co.in
```

### Step 2: That's It! 🎉

Resend will automatically use your configured domain. No additional DNS setup needed since your domain is already verified with Resend.

## 📧 Email Addresses You Can Use

With your domain `ajstudioz.co.in`, you can send from any address:

```bash
# For this project (authentication)
EMAIL_FROM=noreply@ajstudioz.co.in

# Or use different addresses for different purposes:
EMAIL_FROM=auth@ajstudioz.co.in
EMAIL_FROM=hello@ajstudioz.co.in
EMAIL_FROM=support@ajstudioz.co.in
```

**Important:** Make sure the domain part (`@ajstudioz.co.in`) matches your verified domain in Resend.

## 🧪 Test Your Setup

1. Update your `.env` file:
   ```bash
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=your-actual-api-key
   EMAIL_FROM=noreply@ajstudioz.co.in
   ```

2. Run the test:
   ```bash
   pnpm test:email your-email@example.com
   ```

3. Check your inbox for test emails!

## 🆚 Why Resend Instead of SMTP?

| Feature | Resend | SMTP |
|---------|--------|------|
| **Setup** | ✅ Just API key | ⚠️ Multiple settings |
| **Speed** | ✅ Faster | ⚠️ Slower |
| **Reliability** | ✅ Higher | ⚠️ Variable |
| **Multiple Projects** | ✅ Same API key | ❌ Need separate accounts |
| **Dashboard** | ✅ Great analytics | ⚠️ Limited |
| **Free Tier** | ✅ 3,000/month | ⚠️ 100-500/day |

## 🔑 Where to Find Your Resend API Key

1. Go to: https://resend.com/api-keys
2. Click on your existing API key to reveal it
3. Or create a new one by clicking "Create API Key"
4. Copy and paste into your `.env` file

## 💡 Multiple Projects, Same Domain

This is **perfectly fine** with Resend! You can:

- Project 1 (existing): `noreply@ajstudioz.co.in`
- Project 2 (this one): `noreply@ajstudioz.co.in` ← Same email! ✅

Or use different addresses:

- Project 1: `app1@ajstudioz.co.in`
- Project 2: `auth@ajstudioz.co.in` ← Different emails! ✅

Both work because they use the same verified domain.

## 🔒 Security Best Practices

1. **API Key Permissions**: You can create different API keys for different projects in Resend dashboard
2. **Environment Variables**: Never commit your API key to git
3. **Rate Limiting**: Resend free tier includes 3,000 emails/month (more than enough for most apps)

## 📊 Monitoring

View all email activity in your Resend dashboard:
- https://resend.com/emails

You'll see emails from both projects in one place, making it easy to monitor.

## 🆘 Troubleshooting

### "Invalid API key"
- Check your API key is correct in `.env`
- Make sure it starts with `re_`
- Verify it's not expired in Resend dashboard

### "Domain not verified"
- Your domain should already be verified since you're using it in another project
- If not, verify it at: https://resend.com/domains

### Emails not sending
1. Check logs for error messages
2. Verify `EMAIL_PROVIDER=resend` in `.env`
3. Test connection: `pnpm test:email`
4. Check Resend dashboard for delivery status

## 🎯 Complete `.env` Example

```bash
# Email Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_123abc456def789ghi
EMAIL_FROM=noreply@ajstudioz.co.in

# Your other environment variables...
BETTER_AUTH_SECRET=your-secret
POSTGRES_URL=your-db-url
# etc...
```

## 🚀 Ready to Go!

1. Add your Resend API key to `.env`
2. Set `EMAIL_FROM=noreply@ajstudioz.co.in`
3. Run `pnpm test:email` to verify
4. Start sending emails! 📧✨

---

**Need Help?** 
- Resend Docs: https://resend.com/docs
- Resend Support: support@resend.com
