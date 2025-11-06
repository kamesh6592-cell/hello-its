# Email Test API Endpoint

## 📧 Test Email Service via API

You can test the email service by calling the API endpoint directly from your browser or API client.

## 🚀 Endpoints

### GET `/api/test-email`

Test email service by sending test emails.

**Query Parameters:**
- `to` (required): Email address to send test emails to
- `type` (optional): Type of email to test. Options: `verification`, `welcome`, `reset`, `login`, `all` (default: `all`)

**Examples:**

```bash
# Test all email types
GET https://your-domain.com/api/test-email?to=your-email@example.com

# Test only verification email
GET https://your-domain.com/api/test-email?to=your-email@example.com&type=verification

# Test only password reset email
GET https://your-domain.com/api/test-email?to=your-email@example.com&type=reset
```

**Browser Test:**

Simply open in your browser:
```
http://localhost:3000/api/test-email?to=your-email@example.com
```

### POST `/api/test-email`

Test email service with custom data.

**Request Body:**
```json
{
  "to": "your-email@example.com",
  "type": "verification",
  "userName": "John Doe"
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "all",
    "userName": "Test User"
  }'
```

## 📊 Response Format

**Success Response (200):**
```json
{
  "success": true,
  "message": "All test emails sent successfully to your-email@example.com!",
  "results": {
    "connection": true,
    "verification": true,
    "welcome": true,
    "reset": true,
    "login": true
  },
  "info": {
    "recipient": "your-email@example.com",
    "emailType": "all",
    "provider": "resend",
    "from": "noreply@ajstudioz.co.in"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Missing 'to' parameter. Usage: /api/test-email?to=your-email@example.com"
}
```

## 🧪 Testing Steps

### 1. Start Your Development Server

```bash
pnpm dev
```

### 2. Configure Email in `.env`

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@ajstudioz.co.in
```

### 3. Test via Browser

Open in your browser:
```
http://localhost:3000/api/test-email?to=your-email@gmail.com
```

### 4. Check Your Inbox

You should receive:
- ✉️ Email verification
- ✉️ Welcome email
- ✉️ Password reset
- ✉️ Login notification

## 🔍 Available Email Types

| Type | Description | Example |
|------|-------------|---------|
| `all` | Send all test emails (default) | `?type=all` |
| `verification` | Email verification link | `?type=verification` |
| `welcome` | Welcome message | `?type=welcome` |
| `reset` | Password reset | `?type=reset` |
| `login` | Login notification | `?type=login` |

## 💡 Use Cases

### Quick Browser Test
```
http://localhost:3000/api/test-email?to=test@example.com
```

### Test Specific Email
```
http://localhost:3000/api/test-email?to=test@example.com&type=verification
```

### Production Check
```bash
curl https://your-domain.com/api/test-email?to=admin@example.com&type=all
```

### Custom User Name
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "type": "welcome", "userName": "Alice"}'
```

## 🛡️ Security Considerations

**For Production:**

1. **Add Authentication** - Protect the endpoint:
   ```typescript
   // Check if user is admin
   const session = await getSession();
   if (!session || session.user.role !== 'admin') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

2. **Rate Limiting** - Prevent abuse:
   ```typescript
   // Add rate limiting middleware
   ```

3. **Disable in Production** - Or restrict to admin only:
   ```bash
   ENABLE_EMAIL_TEST_ENDPOINT=false
   ```

**For Development:**
- ✅ Safe to use freely
- ✅ Helpful for testing
- ✅ No security concerns on localhost

## 📝 Example Integration in Your App

### Test Button in Admin Dashboard

```typescript
async function testEmailService(email: string) {
  const response = await fetch(`/api/test-email?to=${email}`);
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Emails sent successfully!');
  } else {
    console.error('❌ Failed:', result.error);
  }
}
```

### React Component

```tsx
"use client";

import { useState } from "react";

export function EmailTester() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-email?to=${email}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email to test"
      />
      <button onClick={handleTest} disabled={loading}>
        {loading ? "Sending..." : "Test Email"}
      </button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

## 🆘 Troubleshooting

### "Email connection failed"
- Check your `.env` configuration
- Verify RESEND_API_KEY or SMTP credentials
- Ensure EMAIL_FROM is set correctly

### "Missing 'to' parameter"
- Make sure to include `?to=email@example.com` in URL
- Check query parameter spelling

### Emails not arriving
- Check spam folder
- Verify email address is correct
- Check Resend dashboard for delivery status
- Look at server logs for errors

## 📚 Related Documentation

- [Resend Quick Start](../RESEND_QUICK_START.md)
- [Email Service Setup](../docs/EMAIL_SERVICE_SETUP.md)
- [Resend Setup Guide](../docs/RESEND_SETUP.md)

---

**Quick Test:** `http://localhost:3000/api/test-email?to=your-email@example.com` 🚀
