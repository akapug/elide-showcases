# LLM Inference Server - Code Examples

This document provides practical examples for using all the features of the production LLM inference server.

## Table of Contents

1. [Basic Chat Completion](#basic-chat-completion)
2. [Streaming Responses](#streaming-responses)
3. [Rate Limiting](#rate-limiting)
4. [Batch Processing](#batch-processing)
5. [Billing Tracking](#billing-tracking)
6. [Embeddings](#embeddings)
7. [Semantic Search](#semantic-search)
8. [A/B Testing](#ab-testing)
9. [Model Management](#model-management)
10. [Advanced Usage](#advanced-usage)

## Basic Chat Completion

### Simple Request
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test-123" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "What is Elide?"}
    ]
  }'
```

### With System Prompt
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test-123" \
  -d '{
    "model": "gpt-4-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "Write a TypeScript function to sort an array"}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

### JavaScript/TypeScript Client
```typescript
async function chatCompletion() {
  const response = await fetch('http://localhost:8080/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-test-123'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Hello!' }
      ]
    })
  });

  const data = await response.json();
  console.log(data.choices[0].message.content);

  // Check rate limits
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const resetAt = response.headers.get('X-RateLimit-Reset');
  console.log(`Rate limit: ${remaining} remaining, resets at ${resetAt}`);
}
```

## Streaming Responses

### cURL with Streaming
```bash
curl -N http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test-123" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Write a short poem about coding"}
    ],
    "stream": true
  }'
```

### JavaScript/TypeScript Streaming Client
```typescript
async function streamingChat() {
  const response = await fetch('http://localhost:8080/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-test-123'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Tell me a story' }],
      stream: true
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        const data = JSON.parse(line.slice(6));
        const content = data.choices[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      }
    }
  }
}
```

## Rate Limiting

### Check Rate Limit Status
```bash
curl http://localhost:8080/v1/rate-limit \
  -H "Authorization: Bearer sk-test-123"
```

### Handle Rate Limit Errors
```typescript
async function handleRateLimits() {
  const response = await fetch('http://localhost:8080/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-test-123'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }]
    })
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter!) * 1000));
    return handleRateLimits(); // Retry
  }

  return response.json();
}
```

## Batch Processing

### Create Batch Job
```bash
curl http://localhost:8080/v1/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test-123" \
  -d '{
    "model": "gpt-3.5-turbo",
    "requests": [
      {"messages": [{"role": "user", "content": "Summarize: AI is transforming..."}]},
      {"messages": [{"role": "user", "content": "Summarize: Machine learning..."}]},
      {"messages": [{"role": "user", "content": "Summarize: Deep learning..."}]}
    ]
  }'
```

### Check Batch Job Status
```bash
curl http://localhost:8080/v1/batch/job_1699000000_abc123 \
  -H "Authorization: Bearer sk-test-123"
```

### TypeScript Batch Processing
```typescript
async function processBatch(documents: string[]) {
  // Create batch job
  const batchResponse = await fetch('http://localhost:8080/v1/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-test-123'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      requests: documents.map(doc => ({
        messages: [{ role: 'user', content: `Summarize: ${doc}` }]
      }))
    })
  });

  const { id } = await batchResponse.json();
  console.log(`Batch job created: ${id}`);

  // Poll for completion
  while (true) {
    const statusResponse = await fetch(`http://localhost:8080/v1/batch/${id}`, {
      headers: { 'Authorization': 'Bearer sk-test-123' }
    });

    const status = await statusResponse.json();
    console.log(`Progress: ${status.progress}%`);

    if (status.status === 'completed') {
      return status.results;
    } else if (status.status === 'failed') {
      throw new Error('Batch job failed');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

## Billing Tracking

### Get Current Usage
```bash
# Monthly usage
curl http://localhost:8080/v1/usage?period=month \
  -H "Authorization: Bearer sk-test-123"

# Daily usage
curl http://localhost:8080/v1/usage?period=day \
  -H "Authorization: Bearer sk-test-123"
```

### Export Billing Data
```bash
# Export as CSV
curl http://localhost:8080/v1/usage/export?format=csv \
  -H "Authorization: Bearer sk-test-123" \
  -o usage.csv

# Export as JSON
curl http://localhost:8080/v1/usage/export?format=json \
  -H "Authorization: Bearer sk-test-123" \
  -o usage.json
```

### Analytics Dashboard
```typescript
async function getAnalytics() {
  const response = await fetch('http://localhost:8080/v1/analytics', {
    headers: { 'Authorization': 'Bearer sk-test-123' }
  });

  const analytics = await response.json();

  console.log('Billing Analytics:');
  console.log(`  Total Cost: $${analytics.billing.totalCost.toFixed(4)}`);
  console.log(`  Total Tokens: ${analytics.billing.totalTokens.toLocaleString()}`);
  console.log(`  Total Requests: ${analytics.billing.totalRequests}`);
  console.log(`  Cache Hit Rate: ${analytics.cache.hitRate.toFixed(2)}%`);
  console.log(`  Projected Monthly Savings: $${analytics.cache.projectedMonthlySavings.toFixed(2)}`);
}
```

## Embeddings

### Generate Embeddings
```bash
curl http://localhost:8080/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test-123" \
  -d '{
    "input": "The quick brown fox jumps over the lazy dog",
    "model": "text-embedding-3-small"
  }'
```

### Batch Embeddings
```bash
curl http://localhost:8080/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-test-123" \
  -d '{
    "input": [
      "First document",
      "Second document",
      "Third document"
    ],
    "model": "text-embedding-3-small"
  }'
```

### TypeScript Embeddings
```typescript
async function generateEmbeddings(texts: string[]) {
  const response = await fetch('http://localhost:8080/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-test-123'
    },
    body: JSON.stringify({
      input: texts,
      model: 'text-embedding-3-small'
    })
  });

  const data = await response.json();

  return data.data.map((item: any) => ({
    text: texts[item.index],
    embedding: item.embedding,
    dimensions: item.embedding.length
  }));
}
```

## Semantic Search

### Search with Embeddings
```bash
curl http://localhost:8080/v1/embeddings/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "model": "text-embedding-3-small",
    "topK": 5,
    "threshold": 0.7
  }'
```

### TypeScript Semantic Search
```typescript
async function semanticSearch(query: string, topK: number = 5) {
  const response = await fetch('http://localhost:8080/v1/embeddings/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      model: 'text-embedding-3-small',
      topK,
      threshold: 0.7
    })
  });

  const data = await response.json();

  console.log(`Top ${topK} results for "${query}":`);
  data.results.forEach((result: any, i: number) => {
    console.log(`${i + 1}. ${result.text} (similarity: ${result.similarity.toFixed(4)})`);
  });

  return data.results;
}
```

## A/B Testing

### Create A/B Test
```bash
curl http://localhost:8080/v1/ab-tests \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-quality-vs-cost",
    "name": "GPT-4 vs GPT-3.5",
    "modelA": "gpt-4-turbo",
    "modelB": "gpt-3.5-turbo",
    "trafficSplit": 50
  }'
```

### List A/B Tests
```bash
curl http://localhost:8080/v1/ab-tests
```

### TypeScript A/B Test Management
```typescript
async function createABTest(
  testId: string,
  modelA: string,
  modelB: string,
  trafficSplit: number = 50
) {
  const response = await fetch('http://localhost:8080/v1/ab-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: testId,
      name: `${modelA} vs ${modelB}`,
      modelA,
      modelB,
      trafficSplit
    })
  });

  const data = await response.json();
  console.log(`A/B test created: ${data.id}`);

  return data;
}

async function getABTestResults() {
  const response = await fetch('http://localhost:8080/v1/ab-tests');
  const { tests } = await response.json();

  tests.forEach((test: any) => {
    console.log(`\n${test.name} (${test.id}):`);
    console.log(`  Model A: ${test.modelA}`);
    console.log(`    Requests: ${test.metrics.modelA.requests}`);
    console.log(`    Avg Latency: ${test.metrics.modelA.avgLatency.toFixed(2)}ms`);
    console.log(`    Error Rate: ${(test.metrics.modelA.errorRate * 100).toFixed(2)}%`);
    console.log(`  Model B: ${test.modelB}`);
    console.log(`    Requests: ${test.metrics.modelB.requests}`);
    console.log(`    Avg Latency: ${test.metrics.modelB.avgLatency.toFixed(2)}ms`);
    console.log(`    Error Rate: ${(test.metrics.modelB.errorRate * 100).toFixed(2)}%`);
  });
}
```

## Model Management

### List Models
```bash
curl http://localhost:8080/v1/models
```

### Get Model Statistics
```bash
curl http://localhost:8080/v1/models/stats
```

### Load/Unload Models
```bash
# Load a model
curl -X POST http://localhost:8080/v1/models/llama-3-70b?action=load

# Unload a model
curl -X POST http://localhost:8080/v1/models/gpt-4-turbo?action=unload
```

### Model Recommendation
```bash
curl http://localhost:8080/v1/models/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "maxCost": 0.00001,
    "minContextWindow": 32000,
    "features": ["chat", "functions"],
    "provider": "openai"
  }'
```

### TypeScript Model Management
```typescript
async function manageModels() {
  // Get all models
  const modelsResponse = await fetch('http://localhost:8080/v1/models/stats');
  const { models } = await modelsResponse.json();

  console.log('Available Models:');
  models.forEach((model: any) => {
    console.log(`  ${model.metadata.id}`);
    console.log(`    Loaded: ${model.loaded}`);
    console.log(`    Requests: ${model.requestCount}`);
    console.log(`    Context Window: ${model.metadata.contextWindow} tokens`);
    console.log(`    Cost: $${model.metadata.costPerInputToken}/token`);
  });

  // Load a specific model
  const loadResponse = await fetch(
    'http://localhost:8080/v1/models/llama-3-70b?action=load',
    { method: 'POST' }
  );

  const loadResult = await loadResponse.json();
  console.log(`Model loaded: ${loadResult.success}`);
}
```

## Advanced Usage

### Complete Workflow Example
```typescript
class LLMClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = 'http://localhost:8080') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async chat(messages: any[], model: string = 'gpt-3.5-turbo') {
    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ model, messages })
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.warn(`Rate limited. Waiting ${retryAfter}s...`);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return this.chat(messages, model);
    }

    if (response.status === 402) {
      throw new Error('Billing limit exceeded');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async embeddings(texts: string[]) {
    const response = await fetch(`${this.baseURL}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: texts,
        model: 'text-embedding-3-small'
      })
    });

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }

  async getUsage(period: 'day' | 'month' = 'month') {
    const response = await fetch(
      `${this.baseURL}/v1/usage?period=${period}`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    );

    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }
}

// Usage
const client = new LLMClient('sk-test-123');

// Chat
const answer = await client.chat([
  { role: 'user', content: 'What is TypeScript?' }
]);
console.log(answer);

// Embeddings
const embeddings = await client.embeddings(['Hello', 'World']);
console.log(`Generated ${embeddings.length} embeddings`);

// Usage stats
const usage = await client.getUsage('month');
console.log(`Monthly cost: $${usage.totalCost.toFixed(2)}`);

// Health
const health = await client.healthCheck();
console.log(`Server status: ${health.status}`);
```

### Monitoring Dashboard
```typescript
async function monitoringDashboard() {
  const interval = setInterval(async () => {
    const health = await fetch('http://localhost:8080/health').then(r => r.json());
    const cache = await fetch('http://localhost:8080/v1/cache/stats').then(r => r.json());
    const batch = await fetch('http://localhost:8080/v1/batch/stats').then(r => r.json());

    console.clear();
    console.log('=== LLM Inference Server Dashboard ===\n');

    console.log('Models:');
    console.log(`  Loaded: ${health.models.loaded}/${health.models.total}`);
    console.log(`  Memory: ${health.models.memory.used}MB / ${health.models.memory.total}MB`);

    console.log('\nCache:');
    console.log(`  Hit Rate: ${cache.stats.hitRate.toFixed(2)}%`);
    console.log(`  Entries: ${cache.stats.totalEntries}`);
    console.log(`  Savings: $${cache.efficiency.projectedMonthlySavings.toFixed(2)}/month`);

    console.log('\nBatch Processing:');
    console.log(`  Pending: ${health.batch.pending}`);
    console.log(`  Throughput: ${health.batch.throughput.toFixed(2)} req/s`);
    console.log(`  Avg Batch Size: ${batch.stats.averageBatchSize.toFixed(2)}`);
  }, 5000);
}
```

## Error Handling

### Comprehensive Error Handling
```typescript
async function robustAPICall(messages: any[]) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-test-123'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages
        })
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`Rate limited. Waiting ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        attempt++;
        continue;
      }

      // Handle billing limits
      if (response.status === 402) {
        throw new Error('Billing limit exceeded. Please upgrade your plan.');
      }

      // Handle bad requests
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(`Bad request: ${error.error}`);
      }

      // Success
      if (response.ok) {
        return await response.json();
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      console.log(`Request failed: ${error}. Retrying...`);
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

## Conclusion

This production LLM inference server provides a complete, enterprise-ready solution for running AI workloads. Use these examples as a starting point for building your own applications!
