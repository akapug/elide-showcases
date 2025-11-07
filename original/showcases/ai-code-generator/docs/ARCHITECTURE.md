# AI Code Generator - Architecture

## Overview

The AI Code Generator is a full-stack application that transforms natural language descriptions into production-ready code. Built with Elide for instant startup and optimized performance.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Client                           │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Chat     │  │   Editor   │  │  Preview   │  │  Export   │ │
│  │ Interface  │  │  (Monaco)  │  │  (iframe)  │  │  Download │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘ │
│        │               │               │               │        │
└────────┼───────────────┼───────────────┼───────────────┼────────┘
         │               │               │               │
         └───────────────┴───────────────┴───────────────┘
                              │ HTTP/REST
         ┌────────────────────┴────────────────────┐
         │                                          │
┌────────▼──────────────────────────────────────────▼─────────────┐
│                    Elide HTTP Server                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes: /api/generate, /api/preview, /api/export       │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │               Middleware Stack                            │   │
│  │  - CORS       - Rate Limiting    - Caching               │   │
│  │  - Auth       - Error Handling   - Logging               │   │
│  └───┬──────────────────────┬─────────────────────┬─────────┘   │
│      │                      │                     │              │
│  ┌───▼──────┐  ┌───────────▼────────┐  ┌─────────▼─────────┐   │
│  │    AI    │  │   Code Generator   │  │   Transpiler      │   │
│  │ Engine   │  │  - TS/JS/React     │  │  - TS ↔ JS        │   │
│  │ (GPT/    │  │  - Python/Ruby     │  │  - JSX ↔ Vue      │   │
│  │ Claude)  │  │  - Java/HTML/CSS   │  │  - Language conv. │   │
│  └──────────┘  └────────────────────┘  └───────────────────┘   │
│                                                                  │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │     Bundler       │  │    Templates     │  │    Cache     │ │
│  │  - Minification   │  │  - React         │  │  - LRU       │ │
│  │  - Tree shaking   │  │  - Vue           │  │  - TTL       │ │
│  │  - Code splitting │  │  - Python/Ruby   │  │  - Memory    │ │
│  └───────────────────┘  └──────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend

#### Chat Interface (`frontend/chat/`)
- Natural language input for code generation
- Conversation history management
- Example prompts and suggestions
- Real-time streaming responses

#### Code Editor (`frontend/editor/`)
- Syntax highlighting
- Code completion
- Error detection
- Multi-file support
- Keyboard shortcuts

#### Preview Panel (`frontend/preview/`)
- Live code execution
- iframe sandboxing
- Error handling
- Hot reload support

#### Export Manager (`frontend/export/`)
- Project packaging
- ZIP/TAR generation
- Dependency inclusion
- Package.json generation

### Backend

#### HTTP Server (`backend/server.ts`)
- Elide-powered HTTP server
- Route handling
- Static file serving
- WebSocket support (future)

#### AI Engine (`backend/ai/`)
- **AIEngine.ts**: Main AI coordinator
- **OpenAIClient.ts**: OpenAI API integration
- **AnthropicClient.ts**: Anthropic (Claude) integration
- **MockAI.ts**: Mock for testing/demo
- **PromptBuilder.ts**: Prompt engineering

Key features:
- Multiple AI provider support
- Context-aware generation
- Streaming responses
- Token management
- Error recovery

#### Code Generator (`backend/generator/`)
- Language-specific generators
- Framework templates
- Dependency resolution
- File structure generation

Supported outputs:
- TypeScript/JavaScript
- React/Vue/Svelte
- Python/Ruby/Java
- HTML/CSS

#### Transpiler (`backend/transpiler/`)
- TypeScript ↔ JavaScript
- JSX ↔ Vue
- TSX ↔ JSX
- AST transformations

#### Bundler (`backend/bundler/`)
- Module resolution
- Code minification
- Tree shaking (basic)
- Source map generation

#### Utilities (`backend/utils/`)
- **cache.ts**: LRU cache with TTL
- **logger.ts**: Structured logging
- **validators.ts**: Input validation

## Data Flow

### Code Generation Flow

```
1. User Input
   ↓
2. Chat → Validate Input
   ↓
3. API Request → Rate Limit Check
   ↓
4. Cache Check
   ↓ (miss)
5. AI Engine → Prompt Builder
   ↓
6. AI Provider (OpenAI/Anthropic)
   ↓
7. Response Parser
   ↓
8. Code Generator → Format & Structure
   ↓
9. Cache Store
   ↓
10. Response → Editor Update
```

### Preview Generation Flow

```
1. Code Change
   ↓
2. Debounce (1s)
   ↓
3. Bundler → Resolve Dependencies
   ↓
4. Transpile (if needed)
   ↓
5. Minify (optional)
   ↓
6. Generate HTML Template
   ↓
7. Sandbox iframe
   ↓
8. Execute & Render
```

### Export Flow

```
1. Export Request
   ↓
2. Collect Files
   ↓
3. Generate package.json
   ↓
4. Generate README
   ↓
5. Create Archive (ZIP/TAR)
   ↓
6. Stream to Client
```

## Performance Optimizations

### Caching Strategy

1. **AI Response Cache**
   - Key: Hash of (prompt + language + framework)
   - TTL: 1 hour
   - Eviction: LRU

2. **Transpilation Cache**
   - Key: Hash of (code + from + to)
   - TTL: 1 hour
   - Eviction: LRU

3. **Template Cache**
   - Key: Template ID
   - TTL: 24 hours
   - Eviction: None (templates don't change)

### Rate Limiting

- **Default**: 60 requests/minute per IP
- **Burst**: Up to 10 concurrent requests
- **Backoff**: Exponential with jitter

### Code Optimization

1. **Lazy Loading**
   - Load editor components on demand
   - Defer preview rendering

2. **Debouncing**
   - Preview updates: 1s
   - Auto-save: 2s

3. **Code Splitting**
   - Separate bundles for editor, preview, chat
   - Dynamic imports

## Security

### Input Validation

- Sanitize all user inputs
- Length limits on prompts (10,000 chars)
- File size limits (1MB per file)
- Max files per project (100)

### Preview Sandboxing

- iframe with restricted sandbox
- No access to parent window
- No network requests (future: allow with CSP)

### Rate Limiting

- IP-based limiting
- API key authentication (optional)
- Request throttling

### CORS

- Configurable allowed origins
- Credentials support
- Preflight caching

## Scalability

### Horizontal Scaling

- Stateless server design
- Shared cache via Redis (future)
- Load balancer support

### Vertical Scaling

- Worker pool for AI requests
- Streaming responses
- Memory-efficient caching

### Database (Future)

- Store user projects
- Track generation history
- Analytics

## Monitoring

### Metrics

- Request rate
- Response time (p50, p95, p99)
- Error rate
- Cache hit rate
- AI token usage

### Logging

- Structured JSON logs
- Different log levels
- Request tracing
- Error tracking

### Health Checks

- `/health` endpoint
- System metrics
- Dependency checks

## Deployment

### Requirements

- Elide runtime (or Node.js 18+)
- 2GB RAM minimum
- 10GB disk space

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# AI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Features
ENABLE_CACHING=true
CACHE_TTL=3600
RATE_LIMIT_MAX=60
```

### Docker Support (Future)

```dockerfile
FROM elide:latest
COPY . /app
WORKDIR /app
EXPOSE 3000
CMD ["elide", "backend/server.ts"]
```

## Future Enhancements

1. **Real-time Collaboration**
   - WebSocket support
   - Operational transforms
   - Cursor sharing

2. **Cloud Deployment**
   - One-click deploy to Vercel/Netlify
   - GitHub integration
   - Auto-deploy on push

3. **Version Control**
   - Git integration
   - Commit history
   - Branch support

4. **Testing Integration**
   - Auto-generate tests
   - Run tests in preview
   - Coverage reports

5. **Plugin System**
   - Custom generators
   - Language extensions
   - UI themes

6. **Mobile Support**
   - Responsive design
   - Touch-friendly editor
   - Mobile preview

## Comparison with bolt.diy

| Feature | AI Code Generator | bolt.diy |
|---------|------------------|----------|
| Startup Time | **0ms** | 2000ms |
| Languages | **8+** | JavaScript only |
| Docker Required | **No** | Yes |
| Dependencies | **Minimal** | Many |
| File Size | **~10MB** | ~100MB |
| Memory Usage | **~50MB** | ~200MB |
| Preview Speed | **Fast** | Moderate |

## Architecture Decisions

### Why Elide?

1. **Instant Startup**: 0ms cold start
2. **Polyglot**: Native support for multiple languages
3. **Performance**: Optimized runtime
4. **Simplicity**: No complex build setup

### Why Mock AI by Default?

1. **Demo Friendly**: Works without API keys
2. **Cost Effective**: No AI costs for testing
3. **Offline Support**: Works without internet
4. **Fast Iteration**: No API latency

### Why Simple Bundler?

1. **Speed**: Faster than Webpack/Rollup
2. **Simplicity**: Less configuration
3. **Transparency**: Easy to understand
4. **Sufficient**: Good enough for demos

## Contributing

See the main README for contribution guidelines.

## License

MIT License - see LICENSE file for details.
