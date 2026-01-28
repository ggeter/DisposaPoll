# Cloudflare API Token Creation - Step-by-Step

## Step 1: Navigate to API Tokens
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click the blue **"Create Token"** button

## Step 2: Choose Template
**Option A (Recommended - Quick):**
- Find **"Edit Cloudflare Workers"** template
- Click **"Use template"** button
- This pre-configures all necessary permissions

**Option B (Custom - More Control):**
- Click **"Create Custom Token"** at the bottom
- Continue to Step 3 below

## Step 3: Configure Permissions (If Using Custom Token)

### Token Name
```
DisposaPoll Development
```

### Permissions Section
Click **"+ Add more"** for each permission below:

| Permission Type | Service | Access Level |
|----------------|---------|--------------|
| Account | **Cloudflare Pages** | **Edit** |
| Account | **D1** | **Edit** |
| Account | **Workers KV Storage** | **Edit** |
| Account | **Workers Scripts** | **Edit** |
| Account | **Account Settings** | **Read** |
| Zone | **Workers Routes** | **Edit** |

### Exact Click Sequence:
1. **First Permission:**
   - Dropdown 1: Select "Account"
   - Dropdown 2: Select "Cloudflare Pages"
   - Dropdown 3: Select "Edit"

2. Click **"+ Add more"** → Repeat for:
   - Account → D1 → Edit
   - Account → Workers KV Storage → Edit
   - Account → Workers Scripts → Edit
   - Account → Account Settings → Read

3. Click **"+ Add more"** → Then:
   - Dropdown 1: Select "Zone"
   - Dropdown 2: Select "Workers Routes"
   - Dropdown 3: Select "Edit"

### Account Resources
- **Include:** Select "All accounts" 
  - OR select specific account if you have multiple

### Zone Resources
- **Include:** Select "All zones"
  - OR select specific zone if you want to restrict

### Client IP Address Filtering (Optional)
- Leave blank for development (allows use from any IP)

### TTL (Time to Live)
- Either:
  - Leave as default (token never expires - rotate manually)
  - OR set to 90/180 days for better security

## Step 4: Create and Copy Token

1. Click **"Continue to summary"**
2. Review permissions summary
3. Click **"Create Token"**
4. **IMPORTANT:** Copy the token immediately (shown only once)
   - Click the blue **"copy"** button
   - OR manually select and copy the entire token string

The token looks like:
```
ey...very_long_string...xyz
```

## Step 5: Save Token Securely

**Temporary (for testing):**
Paste in notepad - you'll use this in next step

**Long-term (recommended):**
Store in password manager (1Password, Bitwarden, etc.)

## Step 6: Set Environment Variable

**Open a NEW terminal in VSCode** (old terminals won't have the variable)

**PowerShell (Recommended):**
```powershell
$env:CLOUDFLARE_API_TOKEN="paste_your_token_here"
```

**CMD:**
```cmd
set CLOUDFLARE_API_TOKEN=paste_your_token_here
```

**bash/Git Bash:**
```bash
export CLOUDFLARE_API_TOKEN="paste_your_token_here"
```

## Step 7: Verify Authentication

```cmd
wrangler whoami
```

**Expected Success Output:**
```
 ⛅️ wrangler 3.x.x
-------------------
Getting User settings...
👋 You are logged in with an API Token, associated with the email 'your-email@example.com'.
┌──────────────────────────────┬──────────────────────────────────┐
│ Account Name                 │ Account ID                        │
├──────────────────────────────┼──────────────────────────────────┤
│ Your Account Name            │ abc123...                         │
└──────────────────────────────┴──────────────────────────────────┘
```

**Save the Account ID** - you'll need it for `wrangler.toml` configuration.

## Troubleshooting

### Error: "10000: Authentication error"
- Token permissions insufficient
- Go back to https://dash.cloudflare.com/profile/api-tokens
- Click **"Edit"** next to your token
- Verify all permissions listed in Step 3

### Error: "wrangler: command not found"
```cmd
npm install -g wrangler
```

### Error: Token not recognized
- Verify no extra spaces before/after token
- Ensure you copied the entire token string
- Try setting variable again in a NEW terminal window

### Verification Still Fails
Use the **"Edit Cloudflare Workers"** template instead:
1. Delete custom token in dashboard
2. Create new token with "Edit Cloudflare Workers" template
3. This ensures all necessary permissions are included

## Next Steps

Once authenticated:
1. ✅ Run `wrangler whoami` successfully
2. Copy your Account ID
3. Return to orchestrator for project initialization
