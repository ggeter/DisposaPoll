# DisposaPoll Deployment Guide

Complete step-by-step guide to deploy DisposaPoll to Cloudflare.

## Prerequisites Checklist

- [x] Node.js 18+ installed
- [x] Wrangler CLI installed globally or locally
- [ ] Cloudflare account created (free tier works)
- [ ] Wrangler authenticated in PowerShell

## Step-by-Step Deployment

### 1. Verify Wrangler Authentication

Open PowerShell (the one where wrangler is authenticated) and verify:

```powershell
wrangler whoami
```

Expected output should show your email and account details.

### 2. Create D1 Database

Run this command in your authenticated PowerShell:

```powershell
wrangler d1 create disposapoll-db
```

**Expected Output:**
```
✅ Successfully created DB 'disposapoll-db'

[[d1_databases]]
binding = "DB"
database_name = "disposapoll-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Action Required:**
1. Copy the `database_id` value
2. Open `wrangler.jsonc` in your project
3. Find line 19 and replace `<YOUR_DATABASE_ID>` with your actual database ID:

```jsonc
"database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. Apply Database Schema

Still in PowerShell, run:

```powershell
wrangler d1 execute disposapoll-db --remote --file=./schema.sql
```

**Expected Output:**
```
🌀 Executing on remote database disposapoll-db (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
🌀 To execute on your local development database, pass the --local flag to 'wrangler d1 execute'
✅ Executed 4 commands in 0.234 seconds
```

This creates all the necessary tables (polls, questions, participants, answers) and indexes.

### 4. Create KV Namespace

Run:

```powershell
wrangler kv namespace create "MAGIC_LINKS"
```

**Expected Output:**
```
🌀 Creating namespace with title "disposapoll-MAGIC_LINKS"
✅ Success!
Add the following to your configuration file:

{ binding = "MAGIC_LINKS", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

**Action Required:**
1. Copy the `id` value
2. Open `wrangler.jsonc`
3. Find line 26 and replace `<YOUR_KV_NAMESPACE_ID>` with your actual namespace ID:

```jsonc
"id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 5. Install Project Dependencies

Back in your project directory:

```powershell
npm install
```

### 6. Generate TypeScript Types

```powershell
npm run types
```

This generates `worker-configuration.d.ts` with proper type bindings for DB and KV.

### 7. Test Locally

```powershell
npm run dev
```

**Expected Output:**
```
⛅️ wrangler 4.61.0
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

**Test the Application:**
1. Open browser to http://localhost:8787
2. You should see the "Create a New Poll" form
3. Create a test poll:
   - Title: "Test Poll"
   - Add a question with type "Single Choice"
   - Add options: "Option A", "Option B"
   - Click "Create Poll"
4. Verify you're redirected to the Owner view with magic links

**Note:** Local dev uses simulated D1 and KV. Data won't persist between runs.

Press `Ctrl+C` to stop the local server when done testing.

### 8. Deploy to Production

```powershell
npm run deploy
```

**Expected Output:**
```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded disposapoll (x.xx sec)
Published disposapoll (x.xx sec)
  https://disposapoll.your-subdomain.workers.dev
```

Your Worker is now live at the provided URL!

### 9. Set Up Cron Trigger (Optional - For Auto-Cleanup)

The cleanup worker is defined in `src/cleanup.ts` but needs to be configured separately.

Create a new file `wrangler-cleanup.jsonc`:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "disposapoll-cleanup",
  "main": "src/cleanup.ts",
  "compatibility_date": "2026-01-27",
  
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "disposapoll-db",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ],

  "triggers": {
    "crons": ["0 2 * * *"]
  }
}
```

Deploy the cleanup worker:

```powershell
wrangler deploy --config wrangler-cleanup.jsonc
```

This runs daily at 02:00 UTC to delete polls inactive for 30+ days.

### 10. Deploy Static Frontend (Cloudflare Pages)

**Option A: Deploy via Wrangler**

```powershell
wrangler pages project create disposapoll
wrangler pages deploy ./public --project-name=disposapoll
```

**Option B: Deploy via Dashboard**

1. Go to Cloudflare Dashboard > Pages
2. Click "Create a project"
3. Connect your Git repository (if using Git)
4. Or upload the `public/` directory directly
5. Set build settings:
   - Build command: (none)
   - Build output directory: `public`
6. Deploy

**Expected Result:**
Your frontend will be available at `https://disposapoll.pages.dev`

### 11. Connect Pages to Worker

In Cloudflare Dashboard:

1. Go to Pages > disposapoll > Settings > Functions
2. Under "Service Bindings" add:
   - Variable name: `API`
   - Service: `disposapoll` (your worker)
3. Save

Or update Pages to point to your Worker domain in `public/app.js`:

```javascript
const API_BASE = 'https://disposapoll.your-subdomain.workers.dev/api';
```

## Verification Checklist

After deployment, verify:

- [ ] Can access the frontend at your Pages URL
- [ ] Can create a new poll
- [ ] Receive owner, viewer, and taker magic links
- [ ] Can submit a response via taker link
- [ ] Can view results via viewer link
- [ ] Results auto-refresh every 5 seconds
- [ ] Owner can delete poll
- [ ] Owner can copy poll

## Troubleshooting

### "Authentication error"

```powershell
wrangler logout
wrangler login
```

### "Database not found"

Verify `database_id` in `wrangler.jsonc` matches the ID from step 2.

### "KV namespace not found"

Verify `id` in `wrangler.jsonc` matches the ID from step 4.

### Worker deployment fails

Check for TypeScript errors:
```powershell
npm run types
```

View full error logs in terminal output.

### Frontend can't reach API

1. Check CORS is enabled (already configured in `src/index.ts`)
2. Verify API_BASE in `public/app.js` points to correct Worker URL
3. Check browser console for errors

### Local dev D1 queries fail

Local D1 requires schema to be applied locally:

```powershell
wrangler d1 execute disposapoll-db --local --file=./schema.sql
```

## Post-Deployment Tasks

### Monitor Usage

View worker analytics:
```powershell
wrangler tail
```

Or in Cloudflare Dashboard > Workers & Pages > disposapoll > Metrics

### Update Configuration

Any changes to `wrangler.jsonc` require redeployment:

```powershell
npm run deploy
```

### Database Migrations

For schema changes, create migration:

```powershell
wrangler d1 migrations create disposapoll-db migration_name
```

Edit the created file in `migrations/`, then apply:

```powershell
wrangler d1 migrations apply disposapoll-db --remote
```

## Environment Variables

For different environments (staging/production), use `wrangler.jsonc` environments:

```jsonc
{
  "name": "disposapoll",
  // ... main config ...
  
  "env": {
    "staging": {
      "name": "disposapoll-staging",
      "d1_databases": [
        {
          "binding": "DB",
          "database_id": "staging-db-id"
        }
      ]
    }
  }
}
```

Deploy to staging:
```powershell
wrangler deploy --env staging
```

## Cost Management

Monitor costs in Cloudflare Dashboard > Account > Billing

**Free Tier Limits:**
- Workers: 100,000 requests/day
- D1: 5GB storage, 5M reads/day, 100k writes/day
- KV: 100,000 reads/day, 1,000 writes/day
- Pages: Unlimited requests

**Paid Plan ($5/month Workers):**
- 10M requests/month included
- Additional requests: $0.50/million

## Backup & Recovery

### Backup D1 Database

```powershell
wrangler d1 export disposapoll-db --remote --output backup.sql
```

### Restore D1 Database

```powershell
wrangler d1 execute disposapoll-db --remote --file=backup.sql
```

### Backup KV Data

Currently no built-in export. Consider implementing custom backup via Worker script if critical.

## Security Best Practices

1. **Rotate API tokens** every 90 days
2. **Monitor logs** for unusual activity
3. **Rate limit** if experiencing abuse (add to Worker code)
4. **Review permissions** on API tokens regularly
5. **Enable Cloudflare WAF** if on paid plan

## Support

For issues:
1. Check logs: `wrangler tail`
2. Review Cloudflare status: https://www.cloudflarestatus.com/
3. Consult Cloudflare Docs: https://developers.cloudflare.com/
4. Open issue in repository

## Next Steps

- [ ] Configure custom domain (Pages settings)
- [ ] Set up monitoring/alerts
- [ ] Implement rate limiting
- [ ] Add analytics tracking
- [ ] Create backup schedule
- [ ] Document API for third-party integrations
