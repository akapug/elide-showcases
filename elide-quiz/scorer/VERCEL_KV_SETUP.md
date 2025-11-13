# Vercel Redis Setup for Elide Quiz Leaderboard

## Quick Setup (2 minutes)

### 1. Connect Redis to Project

You already created a Redis database! Now just connect it:

Go to: https://vercel.com/m-v/scorer/stores

1. Find your Redis database in the list
2. Click on it
3. Click **"Connect Project"**
4. Select the `scorer` project
5. Click **"Connect"**

### 2. Verify Environment Variables

The Redis database will automatically inject these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

Check at: https://vercel.com/m-v/scorer/settings/environment-variables

You should see the KV variables listed there.

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

- **Production**: Vercel Redis (via @vercel/kv) - persistent, fast, global
- **Local Dev**: Falls back to in-memory storage (no Redis needed for testing)

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

- Keeps last 100 submissions (configurable in code)
- Vercel Redis Free Tier: 256MB storage, 10K commands/day
- Perfect for this use case (leaderboard is tiny)

## Troubleshooting

### "Missing required environment variables"

The Redis database isn't connected to the project. Go to:
https://vercel.com/m-v/scorer/stores

Find your Redis database and click "Connect Project" → select `scorer`.

### "Failed to save submission"

Check Vercel logs:
```bash
vercel logs --token eIXrxr7HctmPlBEGyrrxFUOe
```

### Local Development

For local dev, the leaderboard will use in-memory storage (resets on restart).

To test with real Redis locally:
```bash
vercel env pull .env.local --token eIXrxr7HctmPlBEGyrrxFUOe
```

Then run your dev server - it will use the Redis connection from `.env.local`.

## Migration from /tmp

The old implementation used `/tmp/leaderboard.json` which was ephemeral (reset on every deploy).

The new implementation uses Vercel Redis which is:
- ✅ Persistent across deploys
- ✅ Fast (Redis is designed for this)
- ✅ Global (replicated across regions)
- ✅ Free tier (256MB, 10K commands/day)

All existing submissions in `/tmp` will be lost, but that's expected since they were ephemeral anyway.

**Why Redis is perfect for this**:
- Leaderboard data is small (~10KB for 100 submissions)
- Needs fast reads/writes
- Simple key-value storage
- No complex queries needed

## Next Steps

After setup:
1. Test with a few submissions
2. Check leaderboard displays correctly
3. Verify data persists across deploys
4. Monitor Vercel KV usage in dashboard

