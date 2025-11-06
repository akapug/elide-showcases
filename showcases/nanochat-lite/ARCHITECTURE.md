# Nanochat-Lite Architecture

## Overview

Nanochat-Lite is a polyglot ML chat application demonstrating seamless integration of TypeScript (web/API layer) and Python (ML inference layer) in a single Elide runtime process.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ HTML/CSS   │  │ TypeScript   │  │ WebSocket Client  │   │
│  │ UI         │  │ App Logic    │  │ (Real-time)       │   │
│  └────────────┘  └──────────────┘  └───────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/WebSocket
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Elide Runtime Process                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              TypeScript Backend                     │    │
│  │                                                      │    │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────┐  │    │
│  │  │ HTTP Server  │  │ Chat Handler│  │ Tokenizer│  │    │
│  │  │              │  │             │  │  (BPE)   │  │    │
│  │  │ • Routes     │→ │ • Sessions  │→ │          │  │    │
│  │  │ • WebSocket  │  │ • Context   │  │ • Encode │  │    │
│  │  │ • Static     │  │ • Validate  │  │ • Decode │  │    │
│  │  └──────────────┘  └─────────────┘  └──────────┘  │    │
│  │                           ↓                          │    │
│  │                    ┌────────────────┐               │    │
│  │                    │   Response     │               │    │
│  │                    │   Generator    │               │    │
│  │                    └────────────────┘               │    │
│  └────────────────────────┬─────────────────────────────┘  │
│                            │                                │
│                    Zero-Copy Interop                        │
│                            ↓                                │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Python ML Layer                         │  │
│  │                                                       │  │
│  │  ┌───────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │ Inference │  │ Model Loader │  │ Embeddings  │  │  │
│  │  │ Engine    │  │              │  │ Engine      │  │  │
│  │  │           │  │ • PyTorch    │  │             │  │  │
│  │  │ • Generate│  │ • TensorFlow │  │ • Semantic  │  │  │
│  │  │ • Batch   │  │ • ONNX       │  │ • Similarity│  │  │
│  │  │ • Stream  │  │ • HuggingFace│  │ • Search    │  │  │
│  │  └───────────┘  └──────────────┘  └─────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Layer

#### 1. HTML/CSS (`frontend/index.html`, `frontend/styles.css`)

**Purpose**: User interface for chat interaction

**Features**:
- Clean, modern dark theme
- Responsive design
- Real-time message display
- Statistics dashboard
- Settings controls

**Key Elements**:
```html
<div class="messages">       <!-- Message history -->
<form class="chat-form">      <!-- User input -->
<div class="stats">           <!-- Token/message counts -->
<div class="footer-content">  <!-- Settings and controls -->
```

#### 2. TypeScript App (`frontend/app.ts`)

**Purpose**: Client-side application logic

**Responsibilities**:
- Message rendering and formatting
- User input handling
- HTTP/WebSocket communication
- State management
- Error handling

**Core Classes**:
```typescript
class NanochatApp {
  - handleSubmit()      // Process user messages
  - sendViaHTTP()       // HTTP communication
  - sendViaWebSocket()  // Real-time communication
  - renderMessage()     // Display messages
  - updateStats()       // Update UI stats
}
```

#### 3. WebSocket Client (`frontend/websocket-client.ts`)

**Purpose**: Real-time bidirectional communication

**Features**:
- Auto-reconnection with exponential backoff
- Message queuing during disconnections
- Event-based API
- Connection state management

**Core Classes**:
```typescript
class WebSocketClient {
  - connect()           // Establish connection
  - send()              // Send messages
  - onMessage()         // Handle incoming messages
  - attemptReconnect()  // Reconnection logic
}
```

### Backend Layer (TypeScript)

#### 1. HTTP Server (`backend/server.ts`)

**Purpose**: Main server entry point

**Responsibilities**:
- HTTP request handling
- WebSocket management
- Route configuration
- Health checks
- Monitoring

**API Endpoints**:
```
POST   /api/chat          - Send chat message
GET    /api/health        - Health check
GET    /api/stats         - Server statistics
GET    /api/sessions      - List sessions
DELETE /api/sessions/:id  - Delete session
GET    /ws                - WebSocket upgrade
GET    /*                 - Static files
```

**Core Classes**:
```typescript
class NanochatServer {
  - start()                  // Initialize server
  - handleChatRequest()      // Process chat
  - handleWebSocketConnection() // WS handling
  - startCleanupTask()       // Background cleanup
}
```

#### 2. Chat Handler (`backend/chat-handler.ts`)

**Purpose**: Orchestrate chat pipeline

**Responsibilities**:
- Request validation
- Session management
- Context tracking
- Response coordination
- Token counting

**Core Classes**:
```typescript
class ChatHandler {
  - handleChat()        // Main chat processing
  - handleChatStream()  // Streaming responses
  - validateRequest()   // Input validation
  - getRecentHistory()  // Context retrieval
}
```

**Flow**:
```
Request → Validate → Get/Create Session → Tokenize
      → Generate Response → Update Session → Return
```

#### 3. BPE Tokenizer (`backend/tokenizer.ts`)

**Purpose**: Text tokenization for ML processing

**Algorithm**: Byte Pair Encoding (BPE)
- Start with character vocabulary
- Merge frequent pairs iteratively
- Build subword vocabulary
- Efficient text compression

**Core Classes**:
```typescript
class BPETokenizer {
  - encode()            // Text → Token IDs
  - decode()            // Token IDs → Text
  - batchEncode()       // Batch encoding
  - countTokens()       // Efficient counting
  - getStats()          // Usage statistics
}
```

**Performance**:
- 1000+ tokenizations/second
- Compression ratio: 2-4x
- Vocabulary size: ~5000 tokens

#### 4. Response Generator (`backend/response-generator.ts`)

**Purpose**: Generate contextual responses

**Approach**: Pattern-based responses (demo)
- In production: Real LLM inference
- Demo: Intelligent template matching
- Context-aware responses
- Simulated processing delays

**Core Classes**:
```typescript
class ResponseGenerator {
  - generate()          // Generate response
  - generateStream()    // Streaming response
  - selectResponse()    // Pattern matching
}
```

### ML Layer (Python)

#### 1. Inference Engine (`ml/inference.py`)

**Purpose**: ML model inference

**Capabilities**:
- Model loading and management
- Single and batch inference
- Embedding generation
- Performance benchmarking

**Core Classes**:
```python
class InferenceEngine:
    - load_model()       # Load ML model
    - generate()         # Generate text
    - batch_generate()   # Batch inference
    - embed()            # Generate embeddings
```

**Integration**:
```typescript
// TypeScript calls Python directly
import { generate_response } from './ml/inference.py';
const result = await generate_response(prompt);
```

#### 2. Model Loader (`ml/model-loader.py`)

**Purpose**: Universal model loading

**Supported Formats**:
- PyTorch (.pt, .pth)
- TensorFlow (SavedModel)
- ONNX (.onnx)
- Hugging Face (transformers)

**Core Classes**:
```python
class ModelLoader:
    - load_pytorch_model()    # Load PyTorch
    - load_tensorflow_model() # Load TensorFlow
    - load_onnx_model()       # Load ONNX
    - load_huggingface_model() # Load HF
    - optimize_model()        # Quantization, etc.
```

#### 3. Embeddings Engine (`ml/embeddings.py`)

**Purpose**: Text embedding generation

**Capabilities**:
- Dense vector representations
- Semantic similarity search
- Text clustering
- Cache management

**Core Classes**:
```python
class EmbeddingEngine:
    - embed()              # Generate embedding
    - embed_batch()        # Batch embedding
    - find_most_similar()  # Similarity search
    - cluster_texts()      # Text clustering

class SemanticSearch:
    - add_documents()      # Build index
    - search()             # Query index
```

## Data Flow

### Chat Request Flow

```
1. User Input
   ↓
2. Frontend App
   - Validate input
   - Add user message to UI
   ↓
3. HTTP/WebSocket Transport
   - Send to backend
   ↓
4. Server (TypeScript)
   - Route request
   - Extract payload
   ↓
5. Chat Handler (TypeScript)
   - Validate request
   - Get/create session
   - Add to history
   ↓
6. Tokenizer (TypeScript)
   - Count input tokens
   ↓
7. Response Generator (TypeScript/Python)
   - Pattern matching (demo)
   - OR: Python ML inference
   ↓
8. Chat Handler (TypeScript)
   - Add response to history
   - Calculate tokens
   ↓
9. Server (TypeScript)
   - Format response
   ↓
10. HTTP/WebSocket Transport
    - Send to frontend
    ↓
11. Frontend App
    - Render assistant message
    - Update statistics
    ↓
12. User sees response
```

### Streaming Response Flow

```
User Request → Handler → Generator → Async Iterator
                                      ↓
Frontend ← WebSocket ← Chunk 1 ← yield chunk
Frontend ← WebSocket ← Chunk 2 ← yield chunk
Frontend ← WebSocket ← Chunk N ← yield chunk
```

## Key Design Patterns

### 1. Singleton Pattern

Global instances for efficient resource sharing:

```typescript
// Tokenizer singleton
let defaultTokenizer: BPETokenizer | null = null;
export function getTokenizer(): BPETokenizer {
  if (!defaultTokenizer) {
    defaultTokenizer = new BPETokenizer();
  }
  return defaultTokenizer;
}
```

### 2. Factory Pattern

Session creation and management:

```typescript
private getOrCreateSession(id?: string): ChatSession {
  if (id && this.sessions.has(id)) {
    return this.sessions.get(id)!;
  }
  return this.createNewSession(id);
}
```

### 3. Observer Pattern

Event-driven WebSocket communication:

```typescript
wsClient.onMessage((data) => handleMessage(data));
wsClient.onConnect(() => updateStatus(true));
wsClient.onDisconnect(() => updateStatus(false));
```

### 4. Strategy Pattern

Multiple communication modes:

```typescript
if (useWebSocket && wsClient?.isConnected()) {
  sendViaWebSocket(message);
} else {
  sendViaHTTP(message);
}
```

## Performance Optimizations

### 1. Tokenizer Caching

```typescript
// Merge vocabulary pre-computed
private addCommonMerges(startIdx: number): void {
  const commonPairs = ['th', 'he', 'in', ...];
  for (const pair of commonPairs) {
    this.merges.set(pair, idx++);
  }
}
```

### 2. Session Management

```typescript
// Automatic cleanup of old sessions
public cleanupOldSessions(maxAgeMs: number): number {
  const now = Date.now();
  for (const [id, session] of this.sessions) {
    if (now - session.updatedAt > maxAgeMs) {
      this.sessions.delete(id);
    }
  }
}
```

### 3. Batch Processing

```typescript
// Efficient batch encoding
public batchEncode(texts: string[]): number[][] {
  return texts.map(text => this.encode(text));
}
```

### 4. WebSocket Reconnection

```typescript
// Exponential backoff for reconnection
private attemptReconnect(): void {
  const delay = Math.min(
    this.reconnectDelay * Math.pow(2, this.attempts - 1),
    this.maxReconnectDelay
  );
  setTimeout(() => this.connect(), delay);
}
```

## Testing Strategy

### 1. Unit Tests (`tests/tokenizer-test.ts`)

**Coverage**:
- Encoding/decoding correctness
- Edge cases (empty, unicode, special chars)
- Performance benchmarks
- Batch operations

### 2. Integration Tests (`tests/benchmark.ts`)

**Coverage**:
- End-to-end latency
- Throughput measurement
- Memory usage
- Concurrent requests
- Cold start comparison

### 3. Test Execution

```bash
# Run tokenizer tests
npx ts-node tests/tokenizer-test.ts

# Run benchmarks
npx ts-node tests/benchmark.ts
```

## Deployment Architecture

### Development

```
Developer Machine
  ↓
Elide Runtime (local)
  ↓
http://localhost:8080
```

### Production

```
CDN/Edge Nodes
  ↓
Elide Runtime (edge)
  ↓
Global low-latency access
```

### Advantages

1. **Single Process**: No container orchestration
2. **Fast Deploys**: Seconds, not minutes
3. **Edge Ready**: Lightweight, instant startup
4. **Cost Efficient**: Lower resource usage

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
  ├─ Elide Instance 1
  ├─ Elide Instance 2
  └─ Elide Instance N
```

Each instance:
- Fully independent
- No shared state required
- Session affinity optional

### Vertical Scaling

- Memory: ~50-100MB per instance
- CPU: Single core sufficient for moderate load
- Threads: Node.js event loop + Python GIL considerations

## Security

### Input Validation

```typescript
private validateRequest(request: ChatRequest): void {
  if (!request.message || typeof request.message !== 'string') {
    throw new Error('Invalid message');
  }
  if (request.message.length > this.maxMessageLength) {
    throw new Error('Message too long');
  }
  request.message = request.message.trim();
}
```

### Session Management

- Session IDs: Random, unpredictable
- Session expiry: 1 hour default
- History limits: 20 messages max

### Rate Limiting

```typescript
// Per-session rate limiting (future)
if (session.requestsInLastMinute > 60) {
  throw new Error('Rate limit exceeded');
}
```

## Future Enhancements

1. **Real Models**: Integrate actual PyTorch/TensorFlow models
2. **Streaming**: Implement true streaming responses
3. **Persistence**: Add session/history persistence
4. **Auth**: User authentication and authorization
5. **Monitoring**: Detailed metrics and observability
6. **Scaling**: Advanced load balancing and caching

## Conclusion

Nanochat-Lite's architecture demonstrates:
- Clean separation of concerns
- Efficient polyglot integration
- Production-ready patterns
- Scalable design
- Zero cold-start deployment

The combination of TypeScript's web strengths and Python's ML capabilities, unified in Elide, creates a powerful and efficient architecture for modern ML applications.
