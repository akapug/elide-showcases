# API Documentation

Complete API reference for the AI Code Generator.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints are public for demo purposes. In production, use API keys:

```http
X-API-Key: your_api_key_here
```

Or via query parameter:

```
?apiKey=your_api_key_here
```

## Rate Limiting

- **Default**: 60 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Seconds until reset

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "status": 400,
  "timestamp": "2025-11-06T10:30:00.000Z"
}
```

### Common Error Codes

- `400` - Bad Request (validation failed)
- `401` - Unauthorized (API key required)
- `403` - Forbidden (invalid API key)
- `404` - Not Found (endpoint doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Endpoints

### Health Check

Check server health and status.

```http
GET /health
```

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

---

### Generate Code

Generate code from natural language description.

```http
POST /api/generate
```

**Request Body:**

```json
{
  "prompt": "Create a React todo app with TypeScript",
  "language": "typescript",
  "framework": "react",
  "context": {
    "previousCode": "...",
    "conversation": [
      {
        "role": "user",
        "content": "Create a button component"
      }
    ]
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | Natural language description (3-10,000 chars) |
| language | string | No | Target language (default: typescript) |
| framework | string | No | Target framework (default: react) |
| context | object | No | Additional context for generation |
| context.previousCode | string | No | Existing code to build upon |
| context.conversation | array | No | Previous conversation messages |

**Supported Languages:**
- `typescript`
- `javascript`
- `python`
- `ruby`
- `java`
- `html`
- `css`

**Supported Frameworks:**
- `react`
- `vue`
- `angular`
- `svelte`
- `vanilla`
- `none`

**Response:**

```json
{
  "id": "gen_1699276800000_abc123",
  "code": "import React, { useState } from 'react'...",
  "files": [
    {
      "path": "App.tsx",
      "content": "...",
      "language": "typescript"
    },
    {
      "path": "styles.css",
      "content": "...",
      "language": "css"
    }
  ],
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "explanation": "I've created a todo app with...",
  "suggestions": [
    "Add local storage persistence",
    "Add filtering options",
    "Add edit functionality"
  ],
  "metadata": {
    "duration": 850,
    "timestamp": "2025-11-06T10:30:00.000Z",
    "cached": false
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a button component with ripple effect",
    "language": "typescript",
    "framework": "react"
  }'
```

---

### Generate Preview

Generate live preview of code.

```http
POST /api/preview
```

**Request Body:**

```json
{
  "code": "const App = () => <div>Hello</div>",
  "files": [
    {
      "path": "styles.css",
      "content": ".app { color: blue; }",
      "language": "css"
    }
  ],
  "language": "typescript",
  "framework": "react"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Main code to preview (max 1MB) |
| files | array | No | Additional files |
| language | string | No | Code language |
| framework | string | No | Framework (if applicable) |

**Response:**

```json
{
  "previewId": "preview_abc123",
  "previewUrl": "/preview/preview_abc123",
  "bundledCode": "...",
  "sourceMap": "...",
  "metadata": {
    "duration": 90,
    "timestamp": "2025-11-06T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function App() { return <h1>Hello</h1>; }",
    "language": "javascript",
    "framework": "react"
  }'
```

---

### Transpile Code

Transpile code between languages.

```http
POST /api/transpile
```

**Request Body:**

```json
{
  "code": "const x: number = 5;",
  "from": "typescript",
  "to": "javascript",
  "options": {
    "removeTypes": true,
    "target": "es6"
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Code to transpile (max 1MB) |
| from | string | Yes | Source language |
| to | string | Yes | Target language |
| options | object | No | Transpilation options |

**Supported Transpilations:**
- TypeScript ↔ JavaScript
- TSX ↔ JSX
- JSX ↔ Vue

**Response:**

```json
{
  "code": "const x = 5;",
  "sourceMap": "...",
  "warnings": [
    "Auto-generated types may not be accurate"
  ],
  "metadata": {
    "duration": 45,
    "timestamp": "2025-11-06T10:30:00.000Z",
    "cached": false,
    "from": "typescript",
    "to": "javascript"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/transpile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const x: number = 5;",
    "from": "typescript",
    "to": "javascript"
  }'
```

---

### Export Project

Export project as downloadable archive.

```http
POST /api/export
```

**Request Body:**

```json
{
  "projectName": "my-project",
  "format": "zip",
  "files": [
    {
      "path": "index.ts",
      "content": "console.log('hello');",
      "language": "typescript"
    }
  ],
  "includeNodeModules": false
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| projectName | string | No | Project name (default: "project") |
| format | string | No | Archive format (default: "zip") |
| files | array | Yes | Files to include (max 100) |
| includeNodeModules | boolean | No | Include node_modules (default: false) |

**Supported Formats:**
- `zip` - ZIP archive
- `tar` - TAR archive
- `tar.gz` - Compressed TAR archive

**Response:**

Binary data with headers:

```http
Content-Type: application/zip
Content-Disposition: attachment; filename="my-project.zip"
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-app",
    "files": [
      {
        "path": "index.js",
        "content": "console.log(\"hello\");"
      }
    ]
  }' \
  -o my-app.zip
```

---

### List Templates

Get available project templates.

```http
GET /api/templates
```

**Response:**

```json
{
  "templates": [
    {
      "id": "react-typescript-starter",
      "name": "React + TypeScript",
      "description": "Modern React app with TypeScript",
      "language": "typescript",
      "framework": "react",
      "files": 5,
      "category": "react"
    }
  ],
  "total": 10,
  "timestamp": "2025-11-06T10:30:00.000Z"
}
```

**Example:**

```bash
curl http://localhost:3000/api/templates
```

---

## WebSocket API (Future)

Real-time code generation with streaming.

```javascript
const ws = new WebSocket('ws://localhost:3000/api/stream');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'generate',
    prompt: 'Create a todo app',
    language: 'typescript'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'token') {
    // Append token to editor
    console.log(data.content);
  } else if (data.type === 'complete') {
    // Generation complete
    console.log('Done!');
  }
};
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AICodeGenerator } from 'ai-code-generator-sdk';

const client = new AICodeGenerator({
  apiKey: 'your_api_key',
  baseURL: 'http://localhost:3000'
});

// Generate code
const result = await client.generate({
  prompt: 'Create a button component',
  language: 'typescript',
  framework: 'react'
});

console.log(result.code);

// Transpile
const transpiled = await client.transpile({
  code: 'const x: number = 5;',
  from: 'typescript',
  to: 'javascript'
});

// Export
await client.export({
  projectName: 'my-app',
  files: result.files
});
```

### Python

```python
from ai_code_generator import Client

client = Client(
    api_key='your_api_key',
    base_url='http://localhost:3000'
)

# Generate code
result = client.generate(
    prompt='Create a Flask API',
    language='python'
)

print(result.code)

# Export
client.export(
    project_name='my-api',
    files=result.files
)
```

### cURL

```bash
# Set base URL
BASE_URL="http://localhost:3000"

# Generate code
curl -X POST $BASE_URL/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a todo app",
    "language": "typescript"
  }' | jq .

# Transpile
curl -X POST $BASE_URL/api/transpile \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const x: number = 5;",
    "from": "typescript",
    "to": "javascript"
  }' | jq .

# Export
curl -X POST $BASE_URL/api/export \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "my-app",
    "files": [{"path": "index.js", "content": "console.log(\"hi\");"}]
  }' \
  -o project.zip
```

## Best Practices

### 1. Use Caching

Identical requests are cached for 1 hour. Use cache for:
- Repeated generation requests
- Template queries
- Transpilation

### 2. Handle Rate Limits

Check rate limit headers:

```javascript
const response = await fetch('/api/generate', options);

const remaining = response.headers.get('X-RateLimit-Remaining');
const reset = response.headers.get('X-RateLimit-Reset');

if (remaining < 5) {
  console.warn(`Only ${remaining} requests left. Resets in ${reset}s`);
}
```

### 3. Provide Context

For better results, include context:

```json
{
  "prompt": "Add error handling",
  "context": {
    "previousCode": "function getData() { return fetch('/api'); }",
    "conversation": [
      {"role": "user", "content": "Create a data fetching function"},
      {"role": "assistant", "content": "Created getData function"}
    ]
  }
}
```

### 4. Handle Errors

Always handle errors:

```javascript
try {
  const result = await generate(prompt);
  console.log(result.code);
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded
    console.error('Too many requests. Please wait.');
  } else if (error.status === 400) {
    // Validation error
    console.error('Invalid request:', error.message);
  } else {
    // Other error
    console.error('Generation failed:', error.message);
  }
}
```

### 5. Optimize Requests

- **Batch similar requests**: Generate multiple components in one request
- **Use templates**: Start from templates instead of generating from scratch
- **Cache locally**: Store generated code in your app's cache
- **Debounce**: Wait for user to stop typing before generating

## Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Prompt length | 10,000 chars | Per request |
| File size | 1 MB | Per file |
| Files per project | 100 | Per export |
| Requests per minute | 60 | Per IP (default) |
| Concurrent requests | 10 | Per IP |

## Support

- **Documentation**: https://github.com/elide-tools/elide-showcases
- **Issues**: https://github.com/elide-tools/elide-showcases/issues
- **Discord**: https://discord.gg/elide

## License

MIT License
