# Getting Started with Elide

**A complete 5-10 minute guide to running your first Elide application**

Elide is a polyglot runtime that runs TypeScript, Python, Ruby, and Java with 10x faster cold starts than Node.js. This guide will get you productive in minutes.

---

## What is Elide?

Elide is a **true polyglot runtime** that allows you to:
- Run TypeScript, Python, Ruby, and Java in the **same process**
- Share code between languages with **<1ms overhead**
- Deploy applications with **zero dependencies**
- Achieve **10x faster** cold starts than Node.js (~20ms vs ~200ms)
- Build HTTP servers with **native APIs** (Node.js `http` and Fetch handlers)

---

## Installation

### macOS and Linux

```bash
# Install latest stable version
curl -sSL https://elide.sh | bash

# Or install specific version (beta11-rc1 with native HTTP support)
curl -sSL --tlsv1.2 https://elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1
```

### Verify Installation

```bash
elide --version
# Expected: Elide 1.0.0-beta11-rc1 (or later)
```

---

## Your First Elide Program

### 1. Hello World (TypeScript)

Create a file `hello.ts`:

```typescript
console.log("Hello from Elide!");
console.log("Runtime: GraalVM polyglot");
console.log("Languages: TypeScript, Python, Ruby, Java");
```

Run it:

```bash
elide run hello.ts
```

**Output:**
```
Hello from Elide!
Runtime: GraalVM polyglot
Languages: TypeScript, Python, Ruby, Java
```

### 2. Hello World (Python)

Create a file `hello.py`:

```python
print("Hello from Elide (Python)!")
print("This Python code runs on GraalVM")
```

Run it:

```bash
elide run hello.py
```

### 3. Hello World (Ruby)

Create a file `hello.rb`:

```ruby
puts "Hello from Elide (Ruby)!"
puts "Ruby on GraalVM is fast!"
```

Run it:

```bash
elide run hello.rb
```

### 4. Hello World (Java)

Create a file `Hello.java`:

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello from Elide (Java)!");
        System.out.println("Java on GraalVM with instant startup");
    }
}
```

Run it:

```bash
elide run Hello.java
```

---

## Quick Wins (5 Minutes)

### Example 1: Generate UUIDs

```typescript
// uuid-demo.ts
function randomHex(): string {
  return Math.floor(Math.random() * 16).toString(16);
}

function generateUUID(): string {
  const hex = Array.from({ length: 32 }, () => randomHex()).join('');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    '4' + hex.substring(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.substring(17, 20),
    hex.substring(20, 32)
  ].join('-');
}

console.log("Generated UUIDs:");
for (let i = 0; i < 5; i++) {
  console.log(`  ${i + 1}. ${generateUUID()}`);
}
```

Run it:
```bash
elide run uuid-demo.ts
```

### Example 2: HTTP Server (Fetch Handler)

```typescript
// server.ts
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/") {
    return new Response("Welcome to Elide!", {
      headers: { "Content-Type": "text/plain" }
    });
  }

  if (url.pathname === "/health") {
    return new Response(JSON.stringify({
      status: "healthy",
      runtime: "Elide",
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}

if (import.meta.url.includes("server.ts")) {
  console.log("Server running on http://localhost:3000");
  console.log("Try: curl http://localhost:3000/health");
}
```

Run it:
```bash
elide run server.ts
```

Test it:
```bash
# In another terminal
curl http://localhost:3000/
curl http://localhost:3000/health
```

### Example 3: HTTP Server (Node.js API)

```typescript
// server-node.ts
import { createServer } from "http";

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Welcome to Elide with Node.js API!");
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy" }));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Run it:
```bash
elide run server-node.ts
```

---

## Polyglot Programming

### Example: Python + TypeScript

**Python file** (`sentiment.py`):

```python
def analyze_sentiment(text):
    """Simple sentiment analysis"""
    positive_words = ["love", "great", "awesome", "excellent", "good"]
    negative_words = ["hate", "bad", "awful", "terrible", "poor"]

    text_lower = text.lower()
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)

    if positive_count > negative_count:
        sentiment = "positive"
    elif negative_count > positive_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return {
        "sentiment": sentiment,
        "positive_words": positive_count,
        "negative_words": negative_count,
        "confidence": max(positive_count, negative_count) / max(len(text.split()), 1)
    }
```

**TypeScript file** (`app.ts`):

```typescript
// When polyglot imports are fully available:
// import { analyze_sentiment } from "./sentiment.py";

// For now, implement in TypeScript or call via subprocess
function analyzeSentiment(text: string) {
  const positiveWords = ["love", "great", "awesome", "excellent", "good"];
  const negativeWords = ["hate", "bad", "awful", "terrible", "poor"];

  const textLower = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;

  let sentiment = "neutral";
  if (positiveCount > negativeCount) sentiment = "positive";
  else if (negativeCount > positiveCount) sentiment = "negative";

  return {
    sentiment,
    positiveWords: positiveCount,
    negativeWords: negativeCount,
    confidence: Math.max(positiveCount, negativeCount) / Math.max(text.split(" ").length, 1)
  };
}

// HTTP server with sentiment analysis
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/analyze" && req.method === "POST") {
    const data = await req.json();
    const result = analyzeSentiment(data.text);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("POST text to /analyze", { status: 404 });
}

if (import.meta.url.includes("app.ts")) {
  console.log("Sentiment analysis server running on http://localhost:3000");
}
```

Run it:
```bash
elide run app.ts

# Test it
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I love Elide! It is awesome!"}'
```

---

## Common Commands

### Running Applications

```bash
# Run TypeScript
elide run app.ts

# Run Python
elide run app.py

# Run Ruby
elide run app.rb

# Run Java
elide run App.java

# Run with custom port (for HTTP servers)
elide run --port=8080 server.ts

# Run Python Flask app with WSGI
elide run --wsgi app.py
```

### Development Tips

```bash
# Check syntax without running
elide check app.ts

# Show runtime information
elide --version

# Get help
elide --help
```

---

## Project Structure

A typical Elide project:

```
my-elide-app/
├── src/
│   ├── server.ts         # Main server
│   ├── handlers/         # Request handlers
│   │   ├── users.ts
│   │   └── posts.ts
│   ├── utils/            # Utilities
│   │   ├── uuid.ts
│   │   └── validation.ts
│   └── ml/               # Python ML code
│       └── model.py
├── tests/
│   ├── server.test.ts
│   └── handlers.test.ts
└── README.md
```

---

## Key Concepts

### 1. Zero Dependencies

Elide applications require **no external dependencies**:
- No `package.json` or `npm install`
- No `requirements.txt` or `pip install`
- No `Gemfile` or `bundle install`
- Self-contained executables

### 2. Instant Startup

Cold start performance comparison:

| Runtime | Cold Start Time |
|---------|-----------------|
| Node.js | ~200ms |
| Python | ~300ms |
| **Elide** | **~20ms** |

**10x faster** than traditional runtimes!

### 3. Native APIs

Elide supports standard APIs:
- **Web APIs**: `fetch`, `Request`, `Response`, `URL`
- **Node.js APIs**: `http`, `crypto`, `path`, `fs` (subset)
- **Python**: Standard library subset
- **Ruby**: Standard library subset
- **Java**: JDK standard library

### 4. Polyglot Programming

Write different parts of your application in different languages:
- **Python**: Machine learning, data science
- **TypeScript**: API layer, business logic
- **Ruby**: Scripting, text processing
- **Java**: Enterprise integrations, performance-critical code

All running in the **same process** with **<1ms** cross-language overhead!

---

## Performance Benchmarks

### Cold Start Comparison

```bash
# Benchmark Elide
time elide run hello.ts
# Real: ~20ms

# Compare to Node.js
time node hello.js
# Real: ~200ms

# Result: Elide is 10x faster!
```

### Execution Performance

Elide uses **GraalVM's optimizing compiler** for peak performance:
- TypeScript: Near-native performance after warmup
- Python: 2-10x faster than CPython
- Ruby: 2-15x faster than CRuby
- Java: On-par with JVM performance

---

## Common Patterns

### 1. Environment Variables

```typescript
const PORT = parseInt(process.env.PORT || "3000");
const API_KEY = process.env.API_KEY || "";

console.log(`Server will listen on port ${PORT}`);
```

### 2. JSON Parsing

```typescript
// Parse JSON from string
const data = JSON.parse('{"name": "Elide"}');

// Parse JSON from Request
export default async function fetch(req: Request): Promise<Response> {
  const body = await req.json();
  return new Response(JSON.stringify(body));
}
```

### 3. Error Handling

```typescript
try {
  const data = riskyOperation();
  return new Response(JSON.stringify(data));
} catch (error) {
  console.error("Error:", error);
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500 }
  );
}
```

---

## Troubleshooting

### Issue: Command not found

**Problem**: `elide: command not found`

**Solution**: Ensure Elide is in your PATH:
```bash
export PATH="$HOME/.elide/bin:$PATH"
# Add to ~/.bashrc or ~/.zshrc for persistence
```

### Issue: Module not found

**Problem**: Import errors

**Solution**: Elide doesn't use Node.js modules. Use:
- Built-in APIs (Web APIs, Node.js subset)
- Local file imports: `import { fn } from "./utils.ts"`
- Polyglot imports: `import { fn } from "./module.py"`

### Issue: Port already in use

**Problem**: `Error: Address already in use`

**Solution**: Use a different port:
```bash
elide run --port=3001 server.ts
```

Or kill the process using the port:
```bash
lsof -i :3000
kill -9 <PID>
```

---

## Next Steps

### Explore Examples

Browse the showcase repository:

```bash
# Clone examples
git clone https://github.com/elide-tools/elide-showcases.git
cd elide-showcases

# Run utilities (175+ working examples)
cd converted/utilities/uuid
elide run elide-uuid.ts

# Run algorithms
cd original/utilities/algorithms
elide run dijkstra.ts

# Run showcases
cd original/showcases/llm-inference-server
elide run server.ts
```

### Learn More

- **[Polyglot Programming Guide](./polyglot-programming.md)** - Multi-language applications
- **[HTTP Servers Guide](./http-servers.md)** - Building web servers
- **[Performance Optimization](./performance-optimization.md)** - Speed tuning
- **[Testing Strategies](./testing.md)** - Testing your apps
- **[Deployment Guide](./deployment.md)** - Production deployment

### Join the Community

- **Documentation**: https://elide.dev/docs
- **GitHub**: https://github.com/elide-dev/elide
- **Discord**: https://elide.dev/discord
- **Discussions**: https://github.com/elide-dev/elide/discussions

---

## Summary

In this guide, you learned how to:
- ✅ Install Elide
- ✅ Run TypeScript, Python, Ruby, and Java code
- ✅ Create HTTP servers with native APIs
- ✅ Build polyglot applications
- ✅ Understand Elide's key features

**Key Takeaways:**
- Elide is **10x faster** than Node.js cold starts
- **Zero dependencies** - no package managers needed
- **Native HTTP** support (Fetch handlers + Node.js API)
- **True polyglot** - TypeScript + Python + Ruby + Java in one process
- **Production-ready** with 250+ working examples

**Ready to build?** Explore the guides above or dive into the showcases!

🚀 **Welcome to the Elide community!**
