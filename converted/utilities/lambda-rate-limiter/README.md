# Lambda Rate Limiter - Serverless Rate Limiting

Rate limiting designed for AWS Lambda and serverless functions in Elide.

**POLYGLOT SHOWCASE**: One serverless rate limiter that works across JavaScript, Python, Ruby, and Java Lambda functions via Elide!

Based on [lambda-rate-limiter](https://www.npmjs.com/package/lambda-rate-limiter) (~20K+ downloads/week)

## Features

- **Serverless optimized** - Cold start friendly
- **Token bucket algorithm** - Efficient token refilling
- **Pluggable storage** - Memory, DynamoDB, Redis support
- **Burst handling** - Handle traffic spikes gracefully
- **Cost-based limiting** - Weighted operations
- **Zero dependencies** - Pure TypeScript implementation

## Quick Start

```typescript
import { LambdaRateLimiter } from "./elide-lambda-rate-limiter.ts";

// Create limiter (10 requests per minute)
const limiter = new LambdaRateLimiter({
  interval: 60000,
  uniqueTokenPerInterval: 10
});

// Check if request is allowed
const allowed = await limiter.check(1, "user:123");
if (!allowed) {
  throw new Error("Rate limit exceeded");
}
```

## Use Cases

### Lambda Handler
```typescript
export async function handler(event: any) {
  const limiter = new LambdaRateLimiter({
    interval: 60000,
    uniqueTokenPerInterval: 50
  });

  const userId = event.requestContext?.authorizer?.userId;
  const allowed = await limiter.check(1, userId);

  if (!allowed) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: "Rate limit exceeded" })
    };
  }

  // Process request...
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}
```

### API Gateway Integration
```typescript
const apiLimiter = new LambdaRateLimiter({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 100
});

const allowed = await apiLimiter.check(1, `api:${apiKey}`);
```

### Per-User Quotas
```typescript
const quotaLimiter = new LambdaRateLimiter({
  interval: 3600000, // 1 hour
  uniqueTokenPerInterval: 1000
});

const allowed = await quotaLimiter.check(1, `quota:${userId}`);
```

### Cost-Based Limiting
```typescript
// Different operations have different costs
await limiter.check(1, userId);   // List items (1 token)
await limiter.check(5, userId);   // Create item (5 tokens)
await limiter.check(20, userId);  // Bulk update (20 tokens)
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const limiter = new LambdaRateLimiter({ interval: 60000, uniqueTokenPerInterval: 100 });
const allowed = await limiter.check(1, "user:1");
```

### Python (via Elide)
```python
from elide_lambda_rate_limiter import LambdaRateLimiter

limiter = LambdaRateLimiter(interval=60000, uniqueTokenPerInterval=100)
allowed = await limiter.check(1, "user:1")
```

### Ruby (via Elide)
```ruby
limiter = LambdaRateLimiter.new(interval: 60000, uniqueTokenPerInterval: 100)
allowed = limiter.check(1, "user:1")
```

### Java (via Elide)
```java
var limiter = new LambdaRateLimiter(60000, 100);
var allowed = limiter.check(1, "user:1");
```

## API

### `new LambdaRateLimiter(options, storage?)`

**Options:**
- `interval` (number) - Time window in milliseconds
- `uniqueTokenPerInterval` (number) - Max tokens per interval

**Storage (optional):**
- Custom storage implementation (DynamoDB, Redis, etc.)

### `limiter.check(cost, key)`

Check if request is allowed and consume tokens.

**Parameters:**
- `cost` (number) - Number of tokens to consume
- `key` (string) - Unique identifier (user ID, API key, etc.)

**Returns:** `Promise<boolean>` - True if allowed, false if rate limited

### `limiter.getRemaining(key)`

Get remaining tokens for a key.

**Returns:** `Promise<number>` - Number of tokens remaining

## Run the Demo

```bash
elide run elide-lambda-rate-limiter.ts
```

## Benefits

- **Serverless-first** - Designed for Lambda and cloud functions
- **Fast** - Cold start optimized
- **Flexible** - Cost-based and quota-based limiting
- **Scalable** - Works with distributed storage
- **Polyglot** - Works across all Elide languages

## License

MIT
