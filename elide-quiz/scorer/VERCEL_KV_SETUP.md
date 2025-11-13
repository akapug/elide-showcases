# Vercel KV Setup for Elide Quiz Leaderboard

## Quick Setup (5 minutes)

### 1. Create Vercel KV Database

Go to: https://vercel.com/m-v/scorer/stores

1. Click **"Create Database"**
2. Select **"KV"** (Redis)
3. Name it: `elide-quiz-leaderboard`
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. Click **"Create"**

### 2. Connect to Project

The KV database will automatically inject these environment variables into your project:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

No manual configuration needed! The `@vercel/kv` package will automatically use these.

### 3. Deploy

```bash
cd elide-showcases/elide-quiz/scorer
vercel --prod --token eIXrxr7HctmPlBEGyrrxFUOe --yes
```

### 4. Test

Visit: https://scorer-[deployment-id]-m-v.vercel.app

Submit a quiz result and check the leaderboard tab.

## How It Works

### Storage

- **Production**: Vercel KV (Redis) - persistent, fast, global
- **Local Dev**: Falls back to in-memory storage (for testing)

### Data Structure

```json
{
  "submissions": [
    {
      "id": "1234567890",
      "name": "Claude Sonnet 4.5",
      "percentage": 40.41,
      "points": 396,
      "totalPoints": 980,
      "grade": "Fail",
      "timestamp": "2025-01-13T19:42:00.000Z",
      "version": "full"
    }
  ]
}
```

### API Endpoints

- `GET /api/leaderboard` - Retrieve all submissions
- `POST /api/leaderboard` - Add new submission

### Limits

- Keeps last 100 submissions (configurable)
- Vercel KV Free Tier: 256MB storage, 10K commands/day
- Should be plenty for this use case

## Troubleshooting

### "Missing required environment variables"

The KV database isn't connected to the project. Go to:
https://vercel.com/m-v/scorer/stores

And connect the KV database to the project.

### "Failed to save submission"

Check Vercel logs:
```bash
vercel logs --token eIXrxr7HctmPlBEGyrrxFUOe
```

### Local Development

For local dev, the leaderboard will use in-memory storage (resets on restart).

To test with real KV locally:
```bash
vercel env pull .env.local --token eIXrxr7HctmPlBEGyrrxFUOe
```

Then run your dev server with those env vars.

## Migration from /tmp

The old implementation used `/tmp/leaderboard.json` which was ephemeral (reset on every deploy).

The new implementation uses Vercel KV which is:
- ✅ Persistent across deploys
- ✅ Fast (Redis)
- ✅ Global (replicated)
- ✅ Free tier available

All existing submissions in `/tmp` will be lost, but that's expected since they were ephemeral anyway.

## Next Steps

After setup:
1. Test with a few submissions
2. Check leaderboard displays correctly
3. Verify data persists across deploys
4. Monitor Vercel KV usage in dashboard

