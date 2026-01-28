# Wrangler Authentication Setup Guide

## Issue: OAuth Login Callback Failure

`wrangler login` attempts OAuth via localhost:8976 but VSCode terminal can't capture the callback properly.

## Solution: Use API Token Authentication

### Step 1: Generate Cloudflare API Token

1. Visit [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use **"Edit Cloudflare Workers"** template OR create custom token with:
   - **Permissions:**
     - Account - Cloudflare Pages: Edit
     - Account - D1: Edit
     - Account - Workers KV Storage: Edit
     - Account - Workers Scripts: Edit
     - Zone - Workers Routes: Edit
   - **Account Resources:** Include your account
   - **Zone Resources:** All zones (or specific zones)
4. Click **"Continue to summary"** → **"Create Token"**
5. **COPY THE TOKEN** (shown only once)

### Step 2: Authenticate Wrangler

Choose ONE method:

#### Option A: Environment Variable (Recommended for Development)

**Windows CMD:**
```cmd
set CLOUDFLARE_API_TOKEN=your_token_here
wrangler whoami
```

**Windows PowerShell:**
```powershell
$env:CLOUDFLARE_API_TOKEN="your_token_here"
wrangler whoami
```

**Permanent (PowerShell Profile):**
```powershell
notepad $PROFILE
# Add this line:
$env:CLOUDFLARE_API_TOKEN="your_token_here"
```

#### Option B: Wrangler Config File

Create `.wrangler/config.toml` in your home directory:

**Windows:** `C:\Users\<YourUsername>\.wrangler\config.toml`

```toml
[auth]
api_token = "your_token_here"
```

#### Option C: Project-Level .env File

Create `.env` in project root (add to .gitignore!):

```
CLOUDFLARE_API_TOKEN=your_token_here
```

### Step 3: Verify Authentication

```cmd
wrangler whoami
```

Expected output:
```
You are logged in with an API Token, associated with the email '<your-email>'.
```

### Step 4: Get Account ID

```cmd
wrangler whoami
```

Copy your **Account ID** from output. You'll need this for wrangler.toml configuration.

## Troubleshooting

**Error: "Authentication error"**
- Verify token has correct permissions
- Check token hasn't expired (set expiration when creating)
- Ensure no extra spaces in token string

**Error: "10000: Authentication error"**
- Token may be invalid or revoked
- Regenerate token in Cloudflare Dashboard

## Next Steps After Authentication

1. Initialize Workers project: `wrangler init disposapoll-worker`
2. Create D1 database: `wrangler d1 create disposapoll-db`
3. Create KV namespace: `wrangler kv:namespace create "MAGIC_LINKS"`
4. Update wrangler.toml with bindings
5. Deploy: `wrangler deploy`

## Security Notes

- **Never commit API tokens to git** - Add `.env` and `.wrangler/config.toml` to `.gitignore`
- **Use scoped tokens** - Only grant permissions needed for this project
- **Rotate tokens regularly** - Generate new tokens every 90 days
- **Revoke unused tokens** - Clean up old tokens in Cloudflare Dashboard
