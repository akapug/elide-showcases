# Quick Start Guide

Get up and running with the LLM Inference Server in 5 minutes!

## Step 1: Start the Server

```bash
cd /home/user/elide-showcases/original/showcases/llm-inference-server
elide serve server.ts
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║  LLM Inference Server - Production Edition v2.0              ║
║  Running on http://localhost:8080                            ║
╚═══════════════════════════════════════════════════════════════╝
```

## Step 2: Test the Server

### Health Check
```bash
curl http://localhost:8080/health | jq
```

### Simple Chat
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }' | jq
```

### List Models
```bash
curl http://localhost:8080/v1/models | jq
```

## Step 3: Try Key Features

### Rate Limiting
Add an API key to test rate limits:
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-key" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test rate limiting"}]
  }'

# Check rate limit status
curl http://localhost:8080/v1/rate-limit \
  -H "Authorization: Bearer test-key" | jq
```

### Embeddings
```bash
curl http://localhost:8080/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Hello world",
    "model": "text-embedding-3-small"
  }' | jq
```

### Batch Processing
```bash
curl http://localhost:8080/v1/batch \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "requests": [
      {"messages": [{"role": "user", "content": "Hello"}]},
      {"messages": [{"role": "user", "content": "Hi"}]}
    ]
  }' | jq
```

### View Analytics
```bash
curl http://localhost:8080/v1/analytics \
  -H "Authorization: Bearer test-key" | jq
```

## Step 4: Explore Advanced Features

### A/B Testing
```bash
# Create A/B test
curl http://localhost:8080/v1/ab-tests \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "name": "GPT-4 vs GPT-3.5",
    "modelA": "gpt-4-turbo",
    "modelB": "gpt-3.5-turbo",
    "trafficSplit": 50
  }'

# View tests
curl http://localhost:8080/v1/ab-tests | jq
```

### Model Management
```bash
# Load a model
curl -X POST http://localhost:8080/v1/models/llama-3-70b?action=load

# View model stats
curl http://localhost:8080/v1/models/stats | jq
```

### Get Billing Data
```bash
# Monthly usage
curl http://localhost:8080/v1/usage?period=month \
  -H "Authorization: Bearer test-key" | jq

# Export as CSV
curl http://localhost:8080/v1/usage/export?format=csv \
  -H "Authorization: Bearer test-key" > usage.csv
```

## Next Steps

1. **Read the full documentation**: Check out `README.md` for comprehensive API reference
2. **Explore code examples**: See `EXAMPLES.md` for practical code examples
3. **Understand the architecture**: Review the individual module files:
   - `model-manager.ts` - Dynamic model loading
   - `batch-processor.ts` - Batch processing
   - `billing-tracker.ts` - Usage tracking
   - `rate-limiter.ts` - Rate limiting
   - `embeddings-engine.ts` - Embeddings
   - `prompt-cache.ts` - Caching

## Troubleshooting

### Port already in use
```bash
# Use a different port
elide serve --port 8081 server.ts
```

### Rate limit errors (429)
Wait for the rate limit to reset or use a different API key.

### Billing limit errors (402)
The demo has default limits. Check your usage with:
```bash
curl http://localhost:8080/v1/usage -H "Authorization: Bearer your-key"
```

## Production Deployment

For production use:
1. Set up proper authentication (OAuth2/JWT)
2. Configure rate limit tiers for your users
3. Integrate real LLM models (llama.cpp, ONNX, etc.)
4. Add persistent storage for billing data
5. Set up monitoring and alerts
6. Use Redis/Memcached for distributed caching
7. Deploy behind a load balancer

## Support

- Full API Reference: `README.md`
- Code Examples: `EXAMPLES.md`
- Elide Documentation: https://docs.elide.dev

Enjoy building with the production-grade LLM Inference Server!
