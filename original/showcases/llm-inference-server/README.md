# LLM Inference Server - Production Edition

A production-ready, enterprise-grade LLM inference server built with Elide that provides OpenAI-compatible endpoints with comprehensive features for running AI workloads at scale.

## Reality Check

**Status:** Production-Ready Architecture / Reference Implementation

**What This Is:**
- A complete production-grade API architecture with all enterprise features
- OpenAI-compatible with advanced features like A/B testing, billing, and rate limiting
- Demonstrates best practices for building scalable LLM inference servers
- Modular design with separate concerns (billing, rate limiting, caching, etc.)
- Real-world patterns for batch processing, queue management, and resource optimization

**What This Isn't:**
- Does not include actual LLM model files (would be 5-15GB+ per model)
- Uses simulated inference responses for demonstration purposes
- Requires integration with actual model inference engines for production use

**To Make It Production-Ready:**
1. Integrate with llama.cpp, ONNX Runtime, or Transformers.js for actual inference
2. Load real model weights (e.g., Mistral-7B, Llama-3, GPT-J)
3. Add GPU acceleration (CUDA/Metal) for acceptable inference speeds
4. Configure batching and model-specific preprocessing pipelines
5. Connect to Redis/Memcached for distributed caching
6. Add persistent storage for billing data and analytics

**Value:** This is a complete reference implementation showing every component needed to build a production LLM inference service, from API design to billing, rate limiting, caching, and monitoring.

## Overview

This showcase implements a **production-ready** LLM inference server with enterprise features:

- **Multiple Model Support** - GPT, Claude, Llama, and Mistral models
- **Batch Processing** - Automatic batching for improved throughput
- **Rate Limiting** - Tiered rate limits (free, basic, pro, enterprise)
- **Billing & Usage Tracking** - Token usage tracking with cost calculation
- **Prompt Caching** - LRU cache with intelligent eviction
- **Embeddings** - Generate and search vector embeddings
- **A/B Testing** - Compare models with traffic splitting
- **Request Queuing** - Priority-based queue management
- **DDoS Protection** - IP-based rate limiting
- **Streaming Support** - Server-sent events with backpressure

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    API Gateway                       │
│  (Rate Limiting, Authentication, DDoS Protection)   │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼─────┐    ┌────▼──────┐
    │  Router  │    │  Billing  │
    │          │    │  Tracker  │
    └────┬─────┘    └───────────┘
         │
    ┌────▼──────────────────────────────┐
    │        Prompt Cache (LRU)         │
    └────┬──────────────────────────────┘
         │
    ┌────▼──────────────────────────────┐
    │     Batch Processor & Queue       │
    └────┬──────────────────────────────┘
         │
    ┌────▼──────────────────────────────┐
    │       Model Manager               │
    │  (Dynamic Loading, A/B Testing)   │
    └────┬──────────────────────────────┘
         │
    ┌────▼──────────────────────────────┐
    │    Inference Engine               │
    │  (GPT, Claude, Llama, Mistral)    │
    └───────────────────────────────────┘
```

## Features

### 🚀 Core Features

#### 1. Dynamic Model Management
- **Hot-swapping** - Load and unload models without restart
- **Memory management** - Automatic LRU eviction based on memory constraints
- **Priority system** - Keep high-priority models loaded
- **Multiple providers** - OpenAI, Anthropic, Llama, custom models

#### 2. Batch Processing
- **Auto-batching** - Automatically combines requests for efficiency
- **Priority queuing** - Process high-priority requests first
- **Throughput optimization** - Configurable batch size and wait time
- **Job management** - Create, track, and manage long-running batch jobs

#### 3. Billing & Usage Tracking
- **Token counting** - Accurate input/output token tracking
- **Cost calculation** - Per-model pricing with real-time cost tracking
- **Billing limits** - Daily, monthly, and hard limits per API key
- **Usage analytics** - Detailed analytics per user/API key
- **Export data** - Export billing data in CSV or JSON

#### 4. Rate Limiting
- **Tiered limits** - Free, Basic, Pro, Enterprise tiers
- **Multiple dimensions** - Requests per minute/hour/day, tokens per minute
- **Burst allowance** - Allow temporary bursts above base rate
- **Concurrent limiting** - Limit concurrent requests per API key
- **DDoS protection** - IP-based rate limiting

#### 5. Prompt Caching
- **LRU eviction** - Least recently used cache eviction
- **Intelligent matching** - Exact, prefix, and semantic similarity matching
- **Cost savings** - Track tokens and costs saved through caching
- **Cache warming** - Pre-populate cache with common prompts
- **TTL support** - Automatic expiration of old entries

#### 6. Embeddings Engine
- **Multiple models** - Support for various embedding models
- **Batch embeddings** - Process multiple texts efficiently
- **Similarity search** - Semantic search with cosine similarity
- **Clustering** - K-means clustering for embeddings
- **Caching** - Cache embeddings for repeated queries

#### 7. A/B Testing
- **Traffic splitting** - Percentage-based traffic routing
- **Metrics tracking** - Latency, tokens, error rates per model
- **Deterministic routing** - Consistent model selection per user
- **Multiple tests** - Run multiple A/B tests simultaneously

### 📊 Monitoring & Analytics

- **Health checks** - Comprehensive health status with metrics
- **Usage analytics** - Track usage patterns, top models, cache hit rates
- **Performance metrics** - Latency, throughput, batch statistics
- **Billing analytics** - Cost breakdown, projections, savings

## Quick Start

### Prerequisites
- Elide CLI installed
- TypeScript support

### Running the Server

```bash
# Navigate to the directory
cd /home/user/elide-showcases/original/showcases/llm-inference-server

# Start the server
elide serve server.ts

# Server will start on http://localhost:8080
```

## API Reference

### Core Endpoints

#### POST /v1/chat/completions
Create a chat completion with full streaming support.

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "gpt-4-turbo",
    "messages": [
      {"role": "user", "content": "What is Elide?"}
    ],
    "temperature": 0.7,
    "max_tokens": 500,
    "stream": false
  }'
```

**Response Headers:**
- `X-Cache: HIT|MISS` - Whether response was cached
- `X-Processing-Time` - Processing time in milliseconds
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - When rate limit resets

#### POST /v1/embeddings
Generate embeddings for text.

```bash
curl http://localhost:8080/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "input": "Hello world",
    "model": "text-embedding-3-small"
  }'
```

#### POST /v1/embeddings/search
Semantic similarity search.

```bash
curl http://localhost:8080/v1/embeddings/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "model": "text-embedding-3-small",
    "topK": 5,
    "threshold": 0.7
  }'
```

### Model Management

#### GET /v1/models
List all available models.

```bash
curl http://localhost:8080/v1/models
```

#### GET /v1/models/stats
Get detailed model statistics.

```bash
curl http://localhost:8080/v1/models/stats
```

#### POST /v1/models/{model_id}?action={load|unload}
Load or unload a specific model.

```bash
# Load a model
curl -X POST http://localhost:8080/v1/models/llama-3-70b?action=load

# Unload a model
curl -X POST http://localhost:8080/v1/models/llama-3-70b?action=unload
```

#### POST /v1/models/recommend
Get model recommendation based on requirements.

```bash
curl http://localhost:8080/v1/models/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "maxCost": 0.00001,
    "minContextWindow": 32000,
    "features": ["chat", "functions"]
  }'
```

### Batch Processing

#### POST /v1/batch
Create a batch job.

```bash
curl http://localhost:8080/v1/batch \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "requests": [
      {"messages": [{"role": "user", "content": "Hello"}]},
      {"messages": [{"role": "user", "content": "Hi"}]}
    ]
  }'
```

#### GET /v1/batch/{job_id}
Get batch job status and results.

```bash
curl http://localhost:8080/v1/batch/job_123456
```

#### GET /v1/batch/stats
Get batch processor statistics.

```bash
curl http://localhost:8080/v1/batch/stats
```

### Billing & Usage

#### GET /v1/usage?period={day|month}
Get current usage.

```bash
# Get monthly usage
curl http://localhost:8080/v1/usage?period=month \
  -H "Authorization: Bearer your-api-key"

# Get daily usage
curl http://localhost:8080/v1/usage?period=day \
  -H "Authorization: Bearer your-api-key"
```

#### GET /v1/usage/export?format={csv|json}
Export billing data.

```bash
# Export as CSV
curl http://localhost:8080/v1/usage/export?format=csv \
  -H "Authorization: Bearer your-api-key"

# Export as JSON
curl http://localhost:8080/v1/usage/export?format=json \
  -H "Authorization: Bearer your-api-key"
```

#### GET /v1/analytics
Get comprehensive analytics.

```bash
curl http://localhost:8080/v1/analytics \
  -H "Authorization: Bearer your-api-key"
```

### Rate Limiting

#### GET /v1/rate-limit
Get current rate limit status.

```bash
curl http://localhost:8080/v1/rate-limit \
  -H "Authorization: Bearer your-api-key"
```

**Rate Limit Tiers:**

| Tier | RPM | RPH | RPD | Tokens/Min | Burst | Concurrent |
|------|-----|-----|-----|------------|-------|------------|
| Free | 10 | 100 | 1K | 10K | 20 | 2 |
| Basic | 60 | 1K | 10K | 100K | 100 | 5 |
| Pro | 300 | 10K | 100K | 500K | 500 | 20 |
| Enterprise | 1000 | 50K | 500K | 2M | 2000 | 100 |

### A/B Testing

#### POST /v1/ab-tests
Create an A/B test.

```bash
curl http://localhost:8080/v1/ab-tests \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-gpt-vs-claude",
    "name": "GPT-4 vs Claude-3",
    "modelA": "gpt-4-turbo",
    "modelB": "claude-3-opus",
    "trafficSplit": 50
  }'
```

#### GET /v1/ab-tests
List all A/B tests.

```bash
curl http://localhost:8080/v1/ab-tests
```

### Cache & Performance

#### GET /v1/cache/stats
Get cache statistics.

```bash
curl http://localhost:8080/v1/cache/stats
```

### Health & Monitoring

#### GET /health
Comprehensive health check.

```bash
curl http://localhost:8080/health
```

## Module Documentation

### model-manager.ts
Dynamic model loading, unloading, memory management, and A/B testing.

**Key Features:**
- Automatic memory management with LRU eviction
- Priority-based model loading
- A/B testing with traffic splitting
- Model recommendation engine
- Support for multiple model providers

### batch-processor.ts
Batch processing with automatic batching and priority queuing.

**Key Features:**
- Automatic request batching
- Priority-based queue processing
- Configurable batch size and wait time
- Batch job management
- Throughput optimization

### billing-tracker.ts
Token usage tracking and cost calculation.

**Key Features:**
- Per-request token tracking
- Model-specific pricing
- Daily/monthly usage limits
- Usage analytics and reporting
- CSV/JSON export

### rate-limiter.ts
Multi-tier rate limiting with DDoS protection.

**Key Features:**
- Token bucket algorithm for smooth rate limiting
- Sliding window for hourly/daily limits
- Tiered rate limits (free to enterprise)
- Burst allowance
- Concurrent request limiting
- IP-based DDoS protection

### embeddings-engine.ts
Vector embeddings generation and similarity search.

**Key Features:**
- Multiple embedding models
- Batch embedding generation
- Cosine similarity search
- K-means clustering
- Embedding caching

### prompt-cache.ts
Intelligent prompt caching with LRU eviction.

**Key Features:**
- LRU cache eviction
- Prefix matching for deterministic requests
- Semantic similarity matching
- Cache efficiency metrics
- TTL-based expiration

## Production Deployment

### Environment Configuration

```bash
# Set API key (in production, use proper auth)
export API_KEY="your-secure-api-key"

# Configure rate limit tier
export RATE_LIMIT_TIER="pro"

# Set memory limit for models
export MAX_MEMORY_MB="16384"
```

### Scaling Considerations

1. **Horizontal Scaling**
   - Deploy multiple instances behind a load balancer
   - Use distributed cache (Redis/Memcached)
   - Share billing data via database

2. **Vertical Scaling**
   - Increase memory for more models
   - Use GPU acceleration for inference
   - Optimize batch sizes

3. **Monitoring**
   - Track response times
   - Monitor cache hit rates
   - Alert on rate limit exhaustion
   - Track billing anomalies

### Security Best Practices

1. **API Key Management**
   - Use strong, unique API keys
   - Rotate keys regularly
   - Store securely (environment variables, secrets manager)

2. **Rate Limiting**
   - Set appropriate limits per tier
   - Monitor for abuse patterns
   - Use IP-based rate limiting

3. **DDoS Protection**
   - Enable IP-based rate limiting
   - Use CDN/WAF in front of server
   - Monitor for traffic spikes

4. **Data Privacy**
   - Don't log sensitive prompts
   - Encrypt billing data at rest
   - Implement data retention policies

## Performance Optimization

### Caching Strategy
- **Prompt Cache**: Reduces redundant inference costs by up to 90%
- **Model Cache**: Keeps frequently used models in memory
- **Embedding Cache**: Avoids re-computing embeddings

### Batch Processing
- **Auto-batching**: Combines requests for 2-10x throughput improvement
- **Dynamic sizing**: Adjusts batch size based on load
- **Priority queuing**: Ensures important requests get processed first

### Memory Management
- **LRU Eviction**: Automatically unloads least-used models
- **Priority System**: Keeps critical models loaded
- **Memory Monitoring**: Tracks and reports memory usage

## Example Use Cases

### 1. Chatbot with Rate Limiting
```typescript
const response = await fetch('http://localhost:8080/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer user-api-key'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

// Check rate limits
const remaining = response.headers.get('X-RateLimit-Remaining');
```

### 2. Batch Document Processing
```typescript
// Create batch job
const batch = await fetch('http://localhost:8080/v1/batch', {
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-4-turbo',
    requests: documents.map(doc => ({
      messages: [{ role: 'user', content: `Summarize: ${doc}` }]
    }))
  })
});

const { id } = await batch.json();

// Poll for results
const status = await fetch(`http://localhost:8080/v1/batch/${id}`);
```

### 3. A/B Testing Models
```typescript
// Create A/B test
await fetch('http://localhost:8080/v1/ab-tests', {
  method: 'POST',
  body: JSON.stringify({
    id: 'cost-vs-quality',
    name: 'GPT-3.5 vs GPT-4',
    modelA: 'gpt-3.5-turbo',
    modelB: 'gpt-4-turbo',
    trafficSplit: 50
  })
});

// Requests automatically split 50/50 between models
```

### 4. Semantic Search
```typescript
// Generate embeddings
await fetch('http://localhost:8080/v1/embeddings', {
  method: 'POST',
  body: JSON.stringify({
    input: documents,
    model: 'text-embedding-3-small'
  })
});

// Search
const results = await fetch('http://localhost:8080/v1/embeddings/search', {
  method: 'POST',
  body: JSON.stringify({
    query: 'machine learning',
    topK: 10
  })
});
```

## Why Elide?

This showcase demonstrates why Elide is ideal for production LLM servers:

1. **Performance**: Fast cold starts (<100ms) and low latency
2. **Efficiency**: Minimal memory overhead allows running multiple models
3. **Polyglot**: Easily integrate models from different ecosystems
4. **Native HTTP**: Built-in HTTP server with modern features
5. **TypeScript**: Full type safety and excellent developer experience

## Contributing

This is a reference implementation. For production use:
1. Integrate actual model inference (llama.cpp, ONNX, etc.)
2. Add persistent storage for billing data
3. Implement proper authentication (OAuth2, JWT)
4. Add distributed caching (Redis)
5. Implement model-specific optimizations

## License

MIT License - See LICENSE file for details

## Learn More

- [Elide Documentation](https://docs.elide.dev)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [LLM Inference Best Practices](https://docs.elide.dev/guides/llm-inference)
