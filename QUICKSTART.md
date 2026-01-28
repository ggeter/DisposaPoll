# DisposaPoll Quick Start

Run these commands in your **authenticated PowerShell window** (the one where `wrangler` works).

## Prerequisites

### Get Your Cloudflare Account ID

First, you need your Cloudflare Account ID. Run:

```powershell
wrangler whoami
```

Look for the "Account ID" in the output. Copy it.

### Option 1: Set as Environment Variable (Recommended)

**Windows CMD:**
```cmd
set CLOUDFLARE_ACCOUNT_ID=your-account-id-here
```

**Windows PowerShell:**
```powershell
$env:CLOUDFLARE_ACCOUNT_ID="your-account-id-here"
```

### Option 2: Update wrangler.jsonc

Edit `wrangler.jsonc` line 8 and replace `<YOUR_ACCOUNT_ID>` with your actual account ID.

## Setup Commands (Run Once)

### 1. Create D1 Database

```powershell
wrangler d1 create disposapoll-db
```

📋 **Copy the `database_id` from the output**

Then edit `wrangler.jsonc` line 19 and paste your database ID:
```jsonc
"database_id": "paste-your-database-id-here"
```

### 2. Apply Database Schema

```powershell
wrangler d1 execute disposapoll-db --remote --file=./schema.sql
```

✅ Should show: "Executed 4 commands"

### 3. Create KV Namespace

```powershell
wrangler kv namespace create "MAGIC_LINKS"
```

📋 **Copy the `id` from the output**

Then edit `wrangler.jsonc` line 26 and paste your KV namespace ID:
```jsonc
"id": "paste-your-kv-namespace-id-here"
```

### 4. Install Dependencies

```powershell
npm install
```

### 5. Generate Types

```powershell
npm run types
```

## Development Commands

### Test Locally

```powershell
npm run dev
```

🌐 Open http://localhost:8787

### Deploy to Production

```powershell
npm run deploy
```

🚀 Your app will be live at the URL shown in output!

## What You Get

After deployment, you'll have:

- ✅ A live polling application
- ✅ Automatic 30-day data expiration
- ✅ Three magic link types (Owner, Viewer, Taker)
- ✅ Real-time results with auto-refresh
- ✅ QR code generation for easy sharing
- ✅ Anonymous session-based duplicate prevention

## Testing the App

1. Visit your deployed URL
2. Create a poll with a few questions
3. Copy the "Poll Taker" link
4. Open in incognito/another browser
5. Submit a response
6. Go back and click the "Results Viewer" link
7. Watch results refresh in real-time!

## Common Issues

**"ERROR: Unable to authenticate"**
- Make sure you're running commands in the PowerShell where wrangler is authenticated
- Run `wrangler whoami` to verify

**"Database not found"**
- Check that you updated the `database_id` in `wrangler.jsonc`

**"KV namespace not found"**
- Check that you updated the KV `id` in `wrangler.jsonc`

## Next Steps

See [`README.md`](README.md) for full documentation and [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed deployment guide.
