# DisposaPoll

An ephemeral, anonymous polling application built on Cloudflare's edge platform. Polls automatically expire after 30 days of inactivity, ensuring data doesn't persist indefinitely.

## Features

- 🎯 **Three Access Modes**: Owner, Viewer, and Taker roles via magic links
- 🔒 **Anonymous Voting**: No authentication required - simple magic link access
- 📊 **Real-time Results**: Auto-refreshing results display for viewers
- 🗑️ **Auto-Expiration**: Polls automatically deleted after 30 days of inactivity
- ⚡ **Edge Performance**: Runs on Cloudflare's global network
- 💰 **Cost-Effective**: Runs on free/low-cost Cloudflare tiers (~$5/month)

## Tech Stack

- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Cache/Links**: Cloudflare KV
- **Hosting**: Cloudflare Pages
- **Automation**: Cron Triggers for cleanup

## Project Structure

```
DisposaPoll/
├── src/
│   ├── index.ts              # Main Worker entry point
│   ├── cleanup.ts            # Scheduled cleanup worker
│   ├── types.ts              # TypeScript type definitions
│   ├── utils.ts              # Utility functions
│   └── services/
│       ├── magicLinks.ts     # Magic link generation/validation
│       ├── polls.ts          # Poll CRUD operations
│       ├── responses.ts      # Response submission handling
│       └── results.ts        # Results aggregation
├── public/
│   ├── index.html            # Frontend UI
│   └── app.js                # Frontend JavaScript
├── schema.sql                # D1 database schema
├── wrangler.jsonc            # Cloudflare Worker configuration
├── package.json              # Node dependencies
└── tsconfig.json             # TypeScript configuration
```

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Wrangler CLI authenticated

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Authenticate Wrangler

If not already authenticated, run in your PowerShell with proper permissions:

```powershell
wrangler login
```

Or use an API token:
```bash
# Set environment variable (Windows CMD)
set CLOUDFLARE_API_TOKEN=your_token_here

# Or PowerShell
$env:CLOUDFLARE_API_TOKEN="your_token_here"
```

### Step 3: Create D1 Database

```bash
wrangler d1 create disposapoll-db
```

This will output a database ID. Copy it and update [`wrangler.jsonc`](wrangler.jsonc:19) on line 19:

```jsonc
"database_id": "YOUR_DATABASE_ID_HERE"
```

### Step 4: Apply Database Schema

```bash
wrangler d1 execute disposapoll-db --remote --file=./schema.sql
```

### Step 5: Create KV Namespace

```bash
wrangler kv namespace create "MAGIC_LINKS"
```

Copy the namespace ID output and update [`wrangler.jsonc`](wrangler.jsonc:26) on line 26:

```jsonc
"id": "YOUR_KV_NAMESPACE_ID_HERE"
```

### Step 6: Generate TypeScript Types

```bash
npm run types
```

### Step 7: Test Locally

```bash
npm run dev
```

Visit http://localhost:8787 to test the application.

### Step 8: Deploy to Production

```bash
npm run deploy
```

## API Endpoints

### Polls

- `POST /api/polls` - Create new poll
- `GET /api/polls/:code` - Fetch poll by magic link
- `PUT /api/polls/:code` - Update poll (owner only, if not locked)
- `DELETE /api/polls/:code` - Delete poll (owner only)
- `POST /api/polls/:code/copy` - Clone poll with new magic links

### Responses

- `POST /api/responses` - Submit poll answers
- `POST /api/validate` - Check if user already participated

### Results

- `GET /api/results/:code` - Get aggregated results (viewer/owner only)

## Question Types

1. **Single Choice**: Radio buttons, one selection
2. **Multiple Choice**: Checkboxes, multiple selections
3. **Text**: Free-form text response
4. **Rating**: 1-5 star rating scale

## Magic Links

Each poll generates three unique magic links:

- **Owner Link**: Full control - view, edit (if unlocked), delete, copy poll
- **Viewer Link**: View real-time results
- **Taker Link**: Submit responses to the poll

Links expire 30 days after last poll access (TTL resets on each access).

## How It Works

### Poll Creation Flow

1. User creates poll with title, description, and questions
2. System generates random poll ID and three magic link codes
3. Poll and questions saved to D1 database
4. Magic links stored in KV with 30-day TTL
5. User receives owner link with access to all magic links

### Poll Taking Flow

1. User visits taker magic link
2. System validates link in KV and fetches poll from D1
3. User completes poll questions and submits
4. System creates participant record with session fingerprint
5. Answers stored in D1, poll locked on first response
6. User sees thank you message with QR code to share

### Results Viewing Flow

1. User visits viewer magic link
2. System validates link and fetches aggregated results from D1
3. Results displayed with charts (bars for choices, distribution for ratings)
4. Auto-refreshes every 5 seconds to show new responses

### Auto-Cleanup Flow

1. Cron trigger runs daily at 02:00 UTC
2. Deletes polls with `last_accessed > 30 days`
3. D1 foreign key cascades delete questions, participants, answers
4. KV magic links auto-expire via TTL (no manual cleanup needed)

## Session Fingerprinting

To prevent duplicate submissions without authentication:

- Combines IP address (CF-Connecting-IP header) + User-Agent
- Hashes with SHA-256 to create session ID
- Stored in participants table with UNIQUE constraint
- 99% effective for preventing accidental duplicates

## Cost Estimate

Based on 500 polls/month, 50 participants each:

- **Cloudflare Workers**: $5/month (paid plan)
- **D1 Database**: Free (within limits)
- **KV Storage**: Free (within limits)
- **Pages Hosting**: Free
- **Total**: ~$5/month

## Development

### Local Development

```bash
npm run dev
```

Uses local D1 and KV simulation via Wrangler.

### Type Checking

```bash
npm run types
```

Generates `worker-configuration.d.ts` from [`wrangler.jsonc`](wrangler.jsonc).

### Deployment

```bash
npm run deploy
```

Deploys Worker to Cloudflare's global network.

## Security Considerations

- No PII collected (anonymous polling)
- Session fingerprinting for duplicate prevention
- Magic links are cryptographically random (20 chars, 62^20 combinations)
- CORS enabled for API access
- No traditional authentication system

## Limitations

- Maximum 1000 concurrent participants per poll (scalable)
- Poll locked after first response (prevents vote manipulation)
- D1 eventual consistency (~50ms lag possible)
- Session fingerprinting can be bypassed with VPN/different browsers

## Future Enhancements

- Email optional poll results summary
- CSV export of responses
- Poll templates library
- Advanced chart types (pie charts, heat maps)
- Soft delete with 7-day grace period
- CAPTCHA for abuse prevention
- Custom poll expiration times

## License

MIT License - Feel free to use and modify.

## Support

For issues or questions, please open an issue on the repository.
