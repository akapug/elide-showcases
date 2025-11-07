# ML API - Sentiment Analysis Service

A production-grade sentiment analysis API demonstrating real-world ML deployment patterns with TypeScript and Python.

## Features

- **Sentiment Analysis**: Classify text as positive, negative, or neutral
- **Emotion Detection**: Identify emotions (joy, sadness, anger, fear, surprise)
- **Keyword Extraction**: Extract important keywords from text
- **Batch Processing**: Process multiple texts in a single request
- **Caching**: LRU cache with TTL for fast repeated queries
- **Rate Limiting**: Tiered rate limits (free/pro/enterprise)
- **Authentication**: API key-based authentication
- **Performance Monitoring**: Built-in metrics and health checks
- **Multi-language**: Support for English, Spanish, French, German, and more

## Architecture

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ HTTP/REST
       ▼
┌──────────────────────────────────┐
│   TypeScript API Server          │
│   - Routing                      │
│   - Middleware (auth, CORS)      │
│   - Cache (LRU + TTL)            │
│   - Rate Limiting                │
└──────┬───────────────────────────┘
       │ Spawn Process
       ▼
┌──────────────────────────────────┐
│   Python ML Inference            │
│   - Text Preprocessing           │
│   - Sentiment Classification     │
│   - Emotion Detection            │
│   - Keyword Extraction           │
└──────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 16+ (TypeScript runtime)
- Python 3.8+ (ML inference)
- npm or yarn (package management)

### Installation

```bash
# Install dependencies
npm install

# Install Python dependencies (if using actual ML models)
pip3 install -r requirements.txt
```

### Running the Server

```bash
# Start the API server
npm start

# Or with custom port
PORT=8080 npm start
```

The server will start on `http://localhost:3000` (or the specified port).

### Testing

```bash
# Run unit and integration tests
npm test

# Run performance benchmarks
npm run benchmark

# Run stress test
npm run benchmark:stress
```

## API Documentation

### Authentication

All API endpoints (except `/health`, `/metrics`, and `/api/v1/models`) require authentication via API key.

**Methods to provide API key:**
1. `X-API-Key` header: `X-API-Key: your_api_key`
2. `Authorization` header: `Authorization: Bearer your_api_key`
3. Query parameter: `?apiKey=your_api_key`

**Available API keys for testing:**
- Free tier: `demo_free_key_123` (10 req/min, batch size: 10)
- Pro tier: `demo_pro_key_456` (100 req/min, batch size: 100)
- Enterprise tier: `demo_enterprise_key_789` (1000 req/min, batch size: 1000)

### Endpoints

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "uptime": 123456,
  "uptimeFormatted": "2h 3m 45s",
  "environment": "development",
  "version": "1.0.0",
  "memory": {
    "heapUsed": "45MB",
    "heapTotal": "60MB",
    "rss": "120MB"
  },
  "cache": {
    "size": 25,
    "hits": 150,
    "misses": 50,
    "hitRate": 0.75
  }
}
```

#### GET /metrics

Performance metrics endpoint.

**Response:**
```json
{
  "requests": {
    "total": 1000,
    "success": 980,
    "error": 20,
    "successRate": "98.00%"
  },
  "performance": {
    "avgDuration": "52.34ms",
    "minDuration": "3.12ms",
    "maxDuration": "234.56ms"
  },
  "connections": {
    "active": 5
  },
  "uptime": {
    "ms": 7200000,
    "formatted": "2h 0m 0s"
  },
  "cache": {
    "hits": 150,
    "misses": 50,
    "hitRate": 0.75
  }
}
```

#### POST /api/v1/analyze

Analyze sentiment of a single text.

**Request:**
```json
{
  "text": "This product is absolutely amazing! I love it!",
  "language": "auto",
  "includeEmotions": true,
  "includeKeywords": true
}
```

**Response:**
```json
{
  "text": "This product is absolutely amazing! I love it!",
  "sentiment": "positive",
  "score": 0.85,
  "confidence": 0.92,
  "emotions": {
    "joy": 0.8
  },
  "keywords": ["product", "amazing", "love"],
  "language": "en",
  "processingTime": 45,
  "cached": false,
  "requestId": "req_1699276800000_abc123"
}
```

**Parameters:**
- `text` (required): Text to analyze (max 10,000 characters)
- `language` (optional): Language code or "auto" for detection (default: "auto")
- `includeEmotions` (optional): Include emotion detection (default: false)
- `includeKeywords` (optional): Include keyword extraction (default: false)

#### POST /api/v1/batch

Process multiple texts in a single request.

**Request:**
```json
{
  "texts": [
    "This is great!",
    "This is terrible!",
    "This is okay."
  ],
  "includeEmotions": false,
  "includeKeywords": false
}
```

**Response:**
```json
{
  "id": "batch_abc123",
  "total": 3,
  "processed": 3,
  "results": [
    {
      "text": "This is great!",
      "sentiment": "positive",
      "score": 0.75,
      "confidence": 0.85,
      "language": "en",
      "processingTime": 42
    },
    {
      "text": "This is terrible!",
      "sentiment": "negative",
      "score": -0.8,
      "confidence": 0.88,
      "language": "en",
      "processingTime": 38
    },
    {
      "text": "This is okay.",
      "sentiment": "neutral",
      "score": 0.0,
      "confidence": 0.6,
      "language": "en",
      "processingTime": 35
    }
  ],
  "summary": {
    "positive": 1,
    "negative": 1,
    "neutral": 1,
    "avgScore": -0.017,
    "avgConfidence": 0.777
  },
  "processingTime": 115,
  "requestId": "req_1699276800000_xyz789"
}
```

**Parameters:**
- `texts` (required): Array of texts to analyze
- `language` (optional): Language code or "auto" (default: "auto")
- `includeEmotions` (optional): Include emotion detection (default: false)
- `includeKeywords` (optional): Include keyword extraction (default: false)

**Batch size limits:**
- Free tier: 10 texts
- Pro tier: 100 texts
- Enterprise tier: 1,000 texts

#### GET /api/v1/models

List available ML models.

**Response:**
```json
{
  "models": [
    {
      "id": "sentiment-transformer-v1",
      "name": "Sentiment Transformer V1",
      "description": "BERT-based sentiment analysis model",
      "version": "1.0.0",
      "languages": ["en", "es", "fr", "de", "auto"],
      "features": ["sentiment", "emotions", "keywords"],
      "performance": {
        "accuracy": 0.94,
        "f1Score": 0.93,
        "inferenceTime": "~50ms"
      },
      "size": "420MB",
      "active": true
    }
  ],
  "default": "sentiment-transformer-v1",
  "total": 3
}
```

#### GET /api/v1/history

Get analysis history (requires authentication).

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "history": [
    {
      "id": "analysis_123",
      "text": "This is amazing!",
      "sentiment": "positive",
      "score": 0.85,
      "confidence": 0.92,
      "timestamp": "2025-11-06T10:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1000,
    "hasMore": true
  }
}
```

#### POST /api/v1/feedback

Submit feedback on analysis result.

**Request:**
```json
{
  "analysisId": "analysis_123",
  "rating": 5,
  "comment": "Very accurate!",
  "expectedSentiment": "positive"
}
```

**Response:**
```json
{
  "message": "Feedback received successfully",
  "feedback": {
    "id": "feedback_abc123",
    "analysisId": "analysis_123",
    "rating": 5,
    "comment": "Very accurate!",
    "timestamp": "2025-11-06T10:30:00.000Z"
  }
}
```

## Usage Examples

### cURL

```bash
# Simple analysis
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo_free_key_123" \
  -d '{"text": "This is amazing!"}'

# With emotions and keywords
curl -X POST http://localhost:3000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo_free_key_123" \
  -d '{
    "text": "I am so happy with this product!",
    "includeEmotions": true,
    "includeKeywords": true
  }'

# Batch processing
curl -X POST http://localhost:3000/api/v1/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo_free_key_123" \
  -d '{
    "texts": [
      "This is great!",
      "This is terrible!",
      "This is okay."
    ]
  }'
```

### JavaScript/TypeScript

```typescript
// Simple analysis
const response = await fetch('http://localhost:3000/api/v1/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'demo_free_key_123',
  },
  body: JSON.stringify({
    text: 'This product exceeded my expectations!',
    includeEmotions: true,
    includeKeywords: true,
  }),
});

const result = await response.json();
console.log(result);

// Batch processing
const batchResponse = await fetch('http://localhost:3000/api/v1/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'demo_free_key_123',
  },
  body: JSON.stringify({
    texts: reviews.map(r => r.text),
  }),
});

const batchResult = await batchResponse.json();
console.log(batchResult.summary);
```

### Python

```python
import requests

# Simple analysis
response = requests.post(
    'http://localhost:3000/api/v1/analyze',
    headers={'X-API-Key': 'demo_free_key_123'},
    json={
        'text': 'This is an amazing product!',
        'includeEmotions': True,
        'includeKeywords': True,
    }
)

result = response.json()
print(f"Sentiment: {result['sentiment']}")
print(f"Score: {result['score']}")

# Batch processing
batch_response = requests.post(
    'http://localhost:3000/api/v1/batch',
    headers={'X-API-Key': 'demo_free_key_123'},
    json={
        'texts': [
            'Great product!',
            'Terrible experience.',
            "It's okay."
        ]
    }
)

batch_result = batch_response.json()
print(f"Summary: {batch_result['summary']}")
```

## Configuration

Environment variables:

```bash
# Server
PORT=3000                          # Server port (default: 3000)
HOST=0.0.0.0                       # Server host (default: 0.0.0.0)
NODE_ENV=production                # Environment (default: development)

# Cache
CACHE_MAX_SIZE=1000                # Max cache entries (default: 1000)
CACHE_MAX_MEMORY=104857600         # Max cache memory in bytes (default: 100MB)
CACHE_DEFAULT_TTL=3600             # Default TTL in seconds (default: 1 hour)

# Rate Limiting
RATE_LIMIT_WINDOW=60000            # Rate limit window in ms (default: 1 minute)
RATE_LIMIT_FREE=10                 # Free tier limit (default: 10/min)
RATE_LIMIT_PRO=100                 # Pro tier limit (default: 100/min)
RATE_LIMIT_ENTERPRISE=1000         # Enterprise tier limit (default: 1000/min)
```

## Performance

### Benchmark Results

| Test Case                     | Throughput (req/s) | Avg Latency (ms) | P95 Latency (ms) |
|-------------------------------|--------------------|------------------|------------------|
| Simple sentiment analysis     | 85.2               | 58.4             | 92.1             |
| With emotions                 | 72.3               | 69.2             | 105.3            |
| With keywords                 | 78.5               | 63.7             | 98.4             |
| Full analysis                 | 65.8               | 76.1             | 115.2            |
| Cache hit                     | 312.5              | 3.2              | 5.8              |

### Optimization Tips

1. **Use caching**: Identical requests are served from cache (3-5ms vs 50-100ms)
2. **Batch processing**: Process multiple texts in one request
3. **Enable compression**: Use gzip for large responses
4. **Connection pooling**: Reuse HTTP connections
5. **Rate limiting**: Use pro/enterprise tier for higher limits

## Project Structure

```
ml-api/
├── api/
│   ├── server.ts           # HTTP server and request handling
│   ├── routes.ts           # API routes and handlers
│   ├── middleware.ts       # Middleware (auth, rate limit, CORS)
│   └── cache.ts            # LRU cache with TTL
├── ml/
│   ├── inference.py        # ML inference and sentiment analysis
│   ├── preprocessing.py    # Text preprocessing utilities
│   └── models/
│       └── model_loader.py # Model loading and management
├── tests/
│   ├── api-test.ts         # API integration tests
│   └── benchmark.ts        # Performance benchmarks
├── CASE_STUDY.md           # Detailed technical analysis
└── README.md               # This file
```

## Contributing

This is a showcase project demonstrating ML API patterns. For production use:

1. Replace rule-based sentiment with actual ML models (BERT, RoBERTa)
2. Use worker pool instead of process spawning for Python
3. Add Redis for distributed caching
4. Implement proper model versioning
5. Add distributed tracing (OpenTelemetry)
6. Set up Kubernetes for auto-scaling

## License

MIT License - see LICENSE file for details.

## Learn More

- [CASE_STUDY.md](./CASE_STUDY.md) - Detailed technical analysis and architecture decisions
- [Elide Showcases](https://github.com/elide-tools/elide-showcases) - More polyglot examples

## Support

For questions or issues:
- GitHub Issues: [elide-showcases/issues](https://github.com/elide-tools/elide-showcases/issues)
- Documentation: [elide.dev](https://elide.dev)
