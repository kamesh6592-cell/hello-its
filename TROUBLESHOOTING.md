# Troubleshooting Guide

## Azure API Issues

### "Access denied due to invalid subscription key or wrong API endpoint"

This error occurs when Azure DeepSeek or Grok models are configured incorrectly.

**Solution:**
1. Verify your `AZURE_API_KEY` in `.env`:
   ```bash
   AZURE_API_KEY=your_actual_azure_bearer_token_here
   ```

2. Verify your `AZURE_BASE_URL` in `.env`:
   ```bash
   AZURE_BASE_URL=https://flook.services.ai.azure.com/models
   ```
   **Note:** Do NOT include `/chat/completions` - the SDK adds this automatically

3. Check that your Azure subscription is active and the models are deployed

4. Test with curl to verify credentials:
   ```bash
   curl -X POST "https://flook.services.ai.azure.com/models/chat/completions" \
     -H "Authorization: Bearer YOUR_AZURE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"DeepSeek-R1","messages":[{"role":"user","content":"Hello"}]}'
   ```

### Models Not Appearing

If DeepSeek or Grok models don't appear:
- Check that `AZURE_API_KEY` is set in `.env`
- Restart the development server: `pnpm dev`
- Check logs for configuration errors

## Image Generation Issues

### Double Images Appearing

If you see duplicate images:
- This is usually due to the AI model calling the image tool multiple times
- The UI correctly shows only one image (first in the array)
- Not a bug in the display component

### Image Generation Failed

**For Azure DALL-E-3:**
1. Check `AZURE_OPENAI_API_KEY` is set
2. Verify endpoint: should be the full generations URL with `?api-version=2024-02-01`
3. Test with curl

**For Gemini:**
1. Check `GOOGLE_GENERATIVE_AI_API_KEY` is set
2. Verify you have access to Gemini image generation

### "Organization must be verified" Error

This error means the old OpenAI SDK configuration is still being used:
- Should be fixed in latest version
- Verify you're on the latest commit
- Clear Next.js cache: `rm -rf .next` and rebuild

## Database Issues

### "Error checking if first user"

This is normal during build when database isn't connected:
- These are just warnings during static page generation
- Safe to ignore during `pnpm build`
- In production, ensure `POSTGRES_URL` is configured correctly

## Environment Variables

### Required Variables

**Minimum for Azure setup:**
```bash
# Azure AI Services
AZURE_API_KEY=your_azure_key_here
AZURE_BASE_URL=https://flook.services.ai.azure.com/models

# Azure OpenAI (DALL-E-3)
AZURE_OPENAI_API_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=https://flook.cognitiveservices.azure.com/openai/deployments/dall-e-3/images/generations?api-version=2024-02-01

# Database
POSTGRES_URL=postgres://user:pass@host:5432/dbname

# Authentication
BETTER_AUTH_SECRET=generate_with_npx_better_auth_cli_secret
BETTER_AUTH_URL=http://localhost:3000
```

### Optional Variables

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key
```

## Build Errors

### TypeScript Compilation Errors

**Unused imports:**
- Rebuild after pulling latest changes
- Check that all imports are used
- Run `pnpm build` to verify

**Type errors:**
- Update dependencies: `pnpm install`
- Clear cache: `rm -rf .next node_modules`
- Reinstall: `pnpm install`

## Common Commands

```bash
# Fresh install
pnpm install

# Development
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Clear cache
rm -rf .next

# Generate auth secret
npx @better-auth/cli@latest secret

# Check for errors
pnpm lint

# Format code
pnpm format
```

## Getting Help

1. Check this troubleshooting guide
2. Review `API_KEYS_SETUP.md`
3. Check `SECURITY_SETUP.md`
4. Review logs in console
5. Check Azure Portal for API status
6. Verify environment variables are loaded

## Production Checklist

Before deploying:
- [ ] All environment variables configured
- [ ] `AZURE_API_KEY` is production key
- [ ] Database configured and accessible
- [ ] `BETTER_AUTH_SECRET` generated and set
- [ ] `BETTER_AUTH_URL` points to production domain
- [ ] Build passes: `pnpm build`
- [ ] No `.env` file in git repository
- [ ] API keys are different from development

## Security

If you suspect your API keys are compromised:
1. **Immediately** rotate keys in Azure Portal
2. Update `.env` with new keys
3. Restart application
4. Review access logs
5. Check for unauthorized usage
