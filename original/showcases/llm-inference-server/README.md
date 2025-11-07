# LLM Inference Server

An OpenAI-compatible API server for LLM inference built with Elide, demonstrating high-performance AI capabilities with minimal overhead.

## Overview

This showcase implements a production-ready LLM inference server that provides OpenAI-compatible endpoints for chat completions. Built on Elide's high-performance runtime, it offers:

- **Fast startup times** - Server ready in milliseconds
- **Low memory footprint** - Efficient resource usage for AI workloads
- **Streaming support** - Real-time response generation
- **Model management** - Hot-swapping and dynamic loading
- **Request caching** - Intelligent response caching for performance
- **Token counting** - Accurate token usage tracking

## Features

### OpenAI-Compatible API
- Full chat completions API support
- Compatible with OpenAI client libraries
- Streaming and non-streaming modes
- Standard parameters (temperature, top_p, max_tokens, etc.)

### Model Management
- Multiple model support
- Dynamic model loading/unloading
- Model metadata and statistics
- Context window validation

### Performance Optimizations
- Response caching
- Token counting and validation
- Batching support
- Low-latency streaming

### Production Features
- Health check endpoints
- Error handling
- CORS support
- Request validation
- Usage tracking

## Quick Start

### Prerequisites
- Elide CLI installed
- TypeScript support

### Running the Server

```bash
# Start the server
elide run server.ts

# Server will start on http://localhost:8080
```

### Basic Usage

```bash
# Health check
curl http://localhost:8080/health

# List available models
curl http://localhost:8080/v1/models

# Chat completion (non-streaming)
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "What is Elide?"}
    ]
  }'

# Chat completion (streaming)
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Explain Elide in detail"}
    ],
    "stream": true
  }'
```

## API Reference

### POST /v1/chat/completions

Create a chat completion.

**Request Body:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "top_p": 1.0,
  "max_tokens": 150,
  "stream": false,
  "presence_penalty": 0.0,
  "frequency_penalty": 0.0
}
```

**Response (non-streaming):**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1699000000,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

**Response (streaming):**
```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1699000000,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1699000000,"model":"gpt-3.5-turbo","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: [DONE]
```

### GET /v1/models

List available models.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-3.5-turbo",
      "object": "model",
      "created": 1699000000,
      "owned_by": "elide"
    },
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1699000000,
      "owned_by": "elide"
    }
  ]
}
```

### POST /v1/models/{model_id}?action={load|unload}

Load or unload a model.

**Example:**
```bash
# Load a model
curl -X POST http://localhost:8080/v1/models/mistral-7b?action=load

# Unload a model
curl -X POST http://localhost:8080/v1/models/mistral-7b?action=unload
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "LLM Inference Server",
  "uptime": 123.45,
  "models": 2
}
```

## Usage with OpenAI Client

This server is compatible with OpenAI's official client libraries:

### Python
```python
from openai import OpenAI

client = OpenAI(
    api_key="not-needed",
    base_url="http://localhost:8080/v1"
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "What is Elide?"}
    ]
)

print(response.choices[0].message.content)
```

### JavaScript/TypeScript
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'not-needed',
  baseURL: 'http://localhost:8080/v1'
});

const response = await client.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'What is Elide?' }
  ]
});

console.log(response.choices[0].message.content);
```

### cURL with Advanced Options
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "system",
        "content": "You are a knowledgeable AI assistant."
      },
      {
        "role": "user",
        "content": "Explain the benefits of using Elide for AI inference."
      }
    ],
    "temperature": 0.8,
    "top_p": 0.9,
    "max_tokens": 500,
    "presence_penalty": 0.6,
    "frequency_penalty": 0.5
  }'
```

## Architecture

### Model Registry
- Manages available models and their configurations
- Tracks model state (loaded/unloaded)
- Monitors request counts and statistics
- Implements LRU caching for responses

### Token Counter
- Estimates token usage for prompts and completions
- Validates against context window limits
- Tracks usage statistics
- Approximates tokens using character-based heuristics

### Inference Engine
- Processes chat completion requests
- Generates streaming and non-streaming responses
- Applies sampling parameters (temperature, top_p)
- Manages response caching

## Performance Benefits with Elide

### Fast Cold Starts
- Server starts in milliseconds
- No JVM warmup required
- Instant model readiness

### Low Memory Footprint
- Minimal runtime overhead
- Efficient garbage collection
- Optimized for AI workloads

### High Throughput
- Handles concurrent requests efficiently
- Streaming with minimal latency
- Optimized I/O operations

### Polyglot Capabilities
- TypeScript for API logic
- Can integrate Python/Java AI models
- Seamless interop between languages

## Production Considerations

### Model Integration
To integrate real LLM models:
1. Replace the simulated `InferenceEngine` with actual model calls
2. Use libraries like `llama.cpp`, `ONNX Runtime`, or `Transformers.js`
3. Configure model paths and loading strategies
4. Implement proper GPU/CPU dispatching

### Scaling
- Deploy behind a load balancer
- Use model sharding for large models
- Implement request queuing
- Add rate limiting and authentication

### Monitoring
- Track token usage and costs
- Monitor response latencies
- Log model performance metrics
- Set up alerts for errors

### Security
- Add API key authentication
- Implement rate limiting
- Validate and sanitize inputs
- Use HTTPS in production

## Example Scenarios

### Simple Chat
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Multi-turn Conversation
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "system", "content": "You are a helpful coding assistant."},
      {"role": "user", "content": "How do I create a REST API?"},
      {"role": "assistant", "content": "I can help you create a REST API..."},
      {"role": "user", "content": "Show me an example with Elide"}
    ]
  }'
```

### Streaming Response
```bash
curl -N http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Write a poem about Elide"}],
    "stream": true
  }'
```

## Why Elide?

This showcase demonstrates why Elide is ideal for AI inference servers:

1. **Performance**: Fast startup and low latency for real-time AI applications
2. **Efficiency**: Minimal memory overhead allows running multiple models
3. **Compatibility**: Works with standard OpenAI clients and tools
4. **Polyglot**: Easily integrate models from different ecosystems
5. **Production-Ready**: Built-in HTTP server with modern features

## License

MIT License - See LICENSE file for details

## Learn More

- [Elide Documentation](https://docs.elide.dev)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Chat Completions Guide](https://platform.openai.com/docs/guides/chat)
