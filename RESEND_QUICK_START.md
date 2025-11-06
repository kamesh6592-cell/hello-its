# 🚀 Quick Start: Email with Your Domain (ajstudioz.co.in)

## ✅ Solution: Use Resend

Since you already have `ajstudioz.co.in` configured with Resend for another project, you can use the **same API key** for this project too!

## 📝 Steps to Setup (2 minutes)

### 1. Get Your Resend API Key

Go to: https://resend.com/api-keys

Copy your existing API key (starts with `re_`)

### 2. Add to `.env` File

```bash
# Email Provider (choose Resend)
EMAIL_PROVIDER=resend

# Your Resend API Key (same one you use for other project)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Your domain email
EMAIL_FROM=noreply@ajstudioz.co.in
```

### 3. Test It

```bash
pnpm test:email your-email@gmail.com
```

## ✨ That's It!

Your email service is now configured and will send emails from `noreply@ajstudioz.co.in` using your existing Resend account.

## 📧 Can I Use Different Emails?

Yes! You can use any email address with your domain:

```bash
# For this project
EMAIL_FROM=noreply@ajstudioz.co.in

# Or different ones:
EMAIL_FROM=auth@ajstudioz.co.in
EMAIL_FROM=hello@ajstudioz.co.in
EMAIL_FROM=support@ajstudioz.co.in
```

All work because the domain (`ajstudioz.co.in`) is already verified with Resend.

## 🎯 What Happens Next?

When users interact with your app:

1. **User signs up** → ✉️ Verification email from `noreply@ajstudioz.co.in`
2. **User clicks verify** → ✅ Account activated
3. **User forgets password** → ✉️ Reset email from `noreply@ajstudioz.co.in`

All automatic! ✨

## 💡 Benefits of Using Resend

- ✅ **Same Domain, Multiple Projects** - No conflicts!
- ✅ **One API Key** - Use across all your projects
- ✅ **3,000 Free Emails/Month** - More than enough
- ✅ **Great Dashboard** - See all emails in one place
- ✅ **Super Fast** - Faster than SMTP
- ✅ **Zero Setup** - Your domain is already verified

## 📊 Where to See Sent Emails?

Dashboard: https://resend.com/emails

You'll see emails from all your projects using this domain.

## 🆘 Need Help?

See detailed guide: [docs/RESEND_SETUP.md](./docs/RESEND_SETUP.md)

---

**Ready?** Just add the 3 lines above to your `.env` and you're done! 🎉
