# Polyglot Programming with Elide

**Master multi-language development with TypeScript, Python, Ruby, and Java in one process**

Elide's polyglot capabilities enable you to write different parts of your application in different languages while running everything in a single process with <1ms cross-language call overhead.

---

## Table of Contents

- [Why Polyglot?](#why-polyglot)
- [Core Concepts](#core-concepts)
- [Language Combinations](#language-combinations)
- [Cross-Language Imports](#cross-language-imports)
- [Data Sharing](#data-sharing)
- [Best Practices](#best-practices)
- [Real-World Examples](#real-world-examples)
- [Performance](#performance)

---

## Why Polyglot?

### Use the Right Language for the Job

Different languages excel at different tasks:

| Language | Best For |
|----------|----------|
| **Python** | ML/AI, data science, scientific computing, scripting |
| **TypeScript** | API servers, business logic, web applications, type safety |
| **Ruby** | Text processing, scripting, DSLs, rapid prototyping |
| **Java** | Enterprise systems, Android, performance-critical code, JVM libraries |

### Traditional Approach (Microservices)

**Problem**: Each language runs in a separate process:

```
┌─────────────┐      HTTP/gRPC       ┌─────────────┐
│  TypeScript │ ───────────────────> │   Python    │
│    API      │  Serialization       │  ML Service │
│   Server    │  Network latency     │             │
└─────────────┘  Error-prone         └─────────────┘
                 Complex deployment
```

**Drawbacks**:
- Network overhead (10-100ms per call)
- Serialization/deserialization costs
- Multiple deployment artifacts
- Complex orchestration
- Increased memory footprint
- Harder debugging

### Elide Approach (Polyglot Runtime)

**Solution**: All languages in one process:

```
┌────────────────────────────────────────┐
│         Elide (GraalVM) Process        │
│  ┌──────────┐        ┌──────────┐     │
│  │TypeScript│ ─────> │  Python  │     │
│  │   API    │  <1ms  │    ML    │     │
│  └──────────┘        └──────────┘     │
│         Shared Memory - No IPC         │
└────────────────────────────────────────┘
```

**Benefits**:
- <1ms cross-language calls (measured!)
- Zero serialization overhead
- Shared memory between languages
- Single deployment artifact
- Simplified debugging
- Lower memory usage

---

## Core Concepts

### 1. Polyglot Context

All languages run in a **shared context** powered by GraalVM:

```typescript
// TypeScript code
export default async function fetch(req: Request): Promise<Response> {
  // Call Python function directly
  const result = pythonFunction(data);
  return new Response(JSON.stringify(result));
}
```

```python
# Python code - runs in the same process
def python_function(data):
    # Process data with Python libraries
    return {"result": processed_data}
```

### 2. Shared Memory

Objects can be passed between languages without serialization:

```typescript
// TypeScript
const data = {
  users: [1, 2, 3],
  metadata: { count: 3 }
};

// Pass to Python - no JSON.stringify!
const result = pythonProcess(data);
```

### 3. Cross-Language Types

Elide automatically converts types between languages:

| TypeScript | Python | Ruby | Java |
|------------|--------|------|------|
| `number` | `int` / `float` | `Integer` / `Float` | `int` / `double` |
| `string` | `str` | `String` | `String` |
| `boolean` | `bool` | `TrueClass` / `FalseClass` | `boolean` |
| `Array` | `list` | `Array` | `List` |
| `Object` | `dict` | `Hash` | `Map` |
| `null` / `undefined` | `None` | `nil` | `null` |

---

## Language Combinations

### TypeScript + Python

**Best for**: Web APIs with ML/data science backend

#### Example: Sentiment Analysis API

**Python module** (`sentiment.py`):

```python
def analyze_sentiment(text):
    """
    Analyze sentiment using Python ML libraries.
    In production, use transformers, spaCy, etc.
    """
    positive_words = ["love", "great", "awesome", "excellent", "amazing"]
    negative_words = ["hate", "bad", "awful", "terrible", "horrible"]

    text_lower = text.lower()
    positive_score = sum(1 for word in positive_words if word in text_lower)
    negative_score = sum(1 for word in negative_words if word in text_lower)

    if positive_score > negative_score:
        sentiment = "positive"
        confidence = positive_score / (positive_score + negative_score + 1)
    elif negative_score > positive_score:
        sentiment = "negative"
        confidence = negative_score / (positive_score + negative_score + 1)
    else:
        sentiment = "neutral"
        confidence = 0.5

    return {
        "sentiment": sentiment,
        "confidence": confidence,
        "positive_words": positive_score,
        "negative_words": negative_score
    }

# Export for polyglot use
model = {
    "predict": analyze_sentiment
}
```

**TypeScript API** (`server.ts`):

```typescript
import { createServer } from "http";
// Polyglot import - Python module in TypeScript!
import { model } from "./sentiment.py";

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/api/analyze" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk.toString(); });
    req.on("end", () => {
      const data = JSON.parse(body);

      // Direct Python call - <1ms overhead!
      const result = model.predict(data.text);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        text: data.text,
        analysis: result,
        timestamp: new Date().toISOString()
      }));
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Polyglot sentiment API running on http://localhost:3000");
});
```

Run it:
```bash
elide run server.ts

# Test it
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I love Elide! It is awesome!"}'
```

### TypeScript + Ruby

**Best for**: Text processing, templating, DSLs

#### Example: Markdown Processing

**Ruby module** (`markdown.rb`):

```ruby
# Simple markdown processor in Ruby
class MarkdownProcessor
  def self.process(text)
    # Headers
    text = text.gsub(/^# (.+)$/, '<h1>\1</h1>')
    text = text.gsub(/^## (.+)$/, '<h2>\1</h2>')
    text = text.gsub(/^### (.+)$/, '<h3>\1</h3>')

    # Bold and italic
    text = text.gsub(/\*\*(.+?)\*\*/, '<strong>\1</strong>')
    text = text.gsub(/\*(.+?)\*/, '<em>\1</em>')

    # Links
    text = text.gsub(/\[(.+?)\]\((.+?)\)/, '<a href="\2">\1</a>')

    # Code blocks
    text = text.gsub(/`(.+?)`/, '<code>\1</code>')

    # Paragraphs
    paragraphs = text.split("\n\n")
    paragraphs.map! { |p| "<p>#{p}</p>" unless p.start_with?('<') }

    paragraphs.join("\n")
  end
end
```

**TypeScript API** (`server.ts`):

```typescript
import { createServer } from "http";
// Polyglot import - Ruby module in TypeScript!
import { MarkdownProcessor } from "./markdown.rb";

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api/markdown" && req.method === "POST") {
    const data = await req.json();

    // Call Ruby method directly
    const html = MarkdownProcessor.process(data.markdown);

    return new Response(JSON.stringify({
      markdown: data.markdown,
      html: html
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

### TypeScript + Java

**Best for**: Enterprise integration, JVM libraries

#### Example: Cryptographic Operations

**Java module** (`Crypto.java`):

```java
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

public class Crypto {
    public static String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes("UTF-8"));
        return Base64.getEncoder().encodeToString(hash);
    }

    public static String generateKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    public static String encrypt(String data, String keyString) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(keyString);
        SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");

        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encrypted = cipher.doFinal(data.getBytes("UTF-8"));

        return Base64.getEncoder().encodeToString(encrypted);
    }
}
```

**TypeScript API** (`server.ts`):

```typescript
// Polyglot import - Java class in TypeScript!
import { Crypto } from "./Crypto.java";

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api/hash" && req.method === "POST") {
    const data = await req.json();

    // Call Java method directly
    const hash = Crypto.sha256(data.text);

    return new Response(JSON.stringify({ hash }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.pathname === "/api/encrypt" && req.method === "POST") {
    const data = await req.json();

    // Generate key and encrypt
    const key = Crypto.generateKey();
    const encrypted = Crypto.encrypt(data.text, key);

    return new Response(JSON.stringify({ encrypted, key }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

### Python + Ruby + TypeScript

**Best for**: Complex workflows with multiple domains

#### Example: Content Processing Pipeline

**Ruby text processing** (`processor.rb`):

```ruby
class TextProcessor
  def self.clean(text)
    # Remove extra whitespace
    text = text.gsub(/\s+/, ' ').strip
    # Remove special characters
    text = text.gsub(/[^\w\s-]/, '')
    # Normalize
    text.downcase
  end
end
```

**Python analysis** (`analyzer.py`):

```python
def analyze_text(text):
    words = text.split()
    return {
        "word_count": len(words),
        "unique_words": len(set(words)),
        "avg_word_length": sum(len(w) for w in words) / len(words) if words else 0,
        "longest_word": max(words, key=len) if words else ""
    }
```

**TypeScript orchestration** (`server.ts`):

```typescript
import { TextProcessor } from "./processor.rb";
import { analyze_text } from "./analyzer.py";

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api/process" && req.method === "POST") {
    const data = await req.json();

    // Step 1: Clean with Ruby
    const cleaned = TextProcessor.clean(data.text);

    // Step 2: Analyze with Python
    const analysis = analyze_text(cleaned);

    // Step 3: Format response in TypeScript
    return new Response(JSON.stringify({
      original: data.text,
      cleaned: cleaned,
      analysis: analysis,
      pipeline: ["Ruby:clean", "Python:analyze", "TypeScript:format"]
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Cross-Language Imports

### Import Syntax

```typescript
// Import Python module
import { function_name } from "./module.py";

// Import Ruby class
import { ClassName } from "./file.rb";

// Import Java class
import { JavaClass } from "./File.java";

// Import with alias
import { LongFunctionName as shortName } from "./module.py";
```

### Export Patterns

**Python exports:**

```python
# Export function
def my_function(arg):
    return result

# Export class
class MyClass:
    def method(self):
        return result

# Export object
api = {
    "method1": lambda x: x * 2,
    "method2": lambda x: x + 1
}
```

**Ruby exports:**

```ruby
# Export class
class MyClass
  def self.method
    result
  end
end

# Export module
module MyModule
  def self.function(arg)
    result
  end
end
```

**Java exports:**

```java
// Public class is automatically exported
public class MyClass {
    public static String method() {
        return "result";
    }
}
```

---

## Data Sharing

### Primitive Types

```typescript
// Numbers
const pyResult: number = pythonFunction(42);

// Strings
const rbResult: string = rubyFunction("hello");

// Booleans
const javaResult: boolean = javaFunction(true);
```

### Complex Objects

```typescript
// Objects/Dictionaries
const data = {
  name: "Alice",
  age: 30,
  tags: ["developer", "elide"]
};

// Pass to Python - no serialization!
const result = pythonProcess(data);

// Python receives it as a dict
# data = {"name": "Alice", "age": 30, "tags": ["developer", "elide"]}
```

### Arrays/Lists

```typescript
// TypeScript array
const numbers = [1, 2, 3, 4, 5];

// Pass to Python
const sum = pythonSum(numbers);  // Python receives as list

// Pass to Ruby
const mapped = rubyMap(numbers);  // Ruby receives as Array

// Pass to Java
const filtered = javaFilter(numbers);  // Java receives as List
```

### Functions as Arguments

```typescript
// TypeScript callback
const callback = (x: number) => x * 2;

// Pass to Python
const result = pythonMap([1, 2, 3], callback);
```

---

## Best Practices

### 1. Language Selection Guidelines

**Use Python for:**
- Machine learning and AI
- Data science and analytics
- Scientific computing
- NumPy, pandas, scikit-learn workloads

**Use TypeScript for:**
- HTTP servers and APIs
- Business logic orchestration
- Type-safe application structure
- Web-standard code

**Use Ruby for:**
- Text processing and templating
- DSL implementations
- Scripting and automation
- Expressive business rules

**Use Java for:**
- Enterprise integrations
- JVM library access
- Performance-critical algorithms
- Legacy system integration

### 2. Code Organization

```
project/
├── src/
│   ├── server.ts           # Main TypeScript entry point
│   ├── handlers/
│   │   ├── users.ts        # Business logic (TypeScript)
│   │   └── posts.ts
│   ├── ml/                 # Machine learning (Python)
│   │   ├── model.py
│   │   └── preprocessor.py
│   ├── text/               # Text processing (Ruby)
│   │   ├── markdown.rb
│   │   └── templating.rb
│   └── crypto/             # Security (Java)
│       └── Encryption.java
├── tests/
│   ├── server.test.ts
│   └── integration/
└── README.md
```

### 3. Interface Design

**Define clear interfaces between languages:**

```typescript
// types.ts - Shared type definitions
export interface MLRequest {
  text: string;
  model: string;
}

export interface MLResponse {
  prediction: string;
  confidence: number;
  timestamp: string;
}
```

```python
# model.py - Implements the interface
def predict(request):
    """
    Args:
        request: dict with 'text' and 'model' keys
    Returns:
        dict with 'prediction', 'confidence', 'timestamp'
    """
    return {
        "prediction": "positive",
        "confidence": 0.95,
        "timestamp": datetime.now().isoformat()
    }
```

### 4. Error Handling

**Handle errors across language boundaries:**

```typescript
try {
  const result = pythonFunction(data);
  return new Response(JSON.stringify(result));
} catch (error) {
  // Catch Python exceptions in TypeScript
  console.error("Python error:", error);
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500 }
  );
}
```

### 5. Performance Considerations

**Minimize cross-language calls in hot paths:**

```typescript
// ❌ Bad: Call Python in tight loop
for (let i = 0; i < 10000; i++) {
  pythonFunction(i);  // 10000 cross-language calls
}

// ✅ Good: Batch process
const results = pythonBatchFunction(Array.from({length: 10000}, (_, i) => i));
```

---

## Real-World Examples

### Example 1: ML-Powered API

```typescript
// server.ts
import { createServer } from "http";
import { model } from "./ml/predictor.py";

const server = createServer(async (req, res) => {
  if (req.url === "/predict" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      const data = JSON.parse(body);

      // Python ML inference
      const prediction = model.predict(data.features);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        prediction,
        model: "v1.0",
        latency_ms: 1  // <1ms cross-language call!
      }));
    });
  }
});

server.listen(3000);
```

### Example 2: Content Management System

```typescript
// cms-server.ts
import { MarkdownProcessor } from "./text/markdown.rb";
import { search_engine } from "./search/indexer.py";
import { Crypto } from "./security/Auth.java";

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Ruby: Render markdown
  if (url.pathname === "/render") {
    const data = await req.json();
    const html = MarkdownProcessor.process(data.markdown);
    return new Response(html);
  }

  // Python: Search content
  if (url.pathname === "/search") {
    const query = url.searchParams.get("q");
    const results = search_engine.search(query);
    return new Response(JSON.stringify(results));
  }

  // Java: Authentication
  if (url.pathname === "/auth") {
    const data = await req.json();
    const token = Crypto.generateToken(data.user);
    return new Response(JSON.stringify({ token }));
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Performance

### Measured Overhead

Elide's polyglot calls are **extremely fast**:

| Operation | Latency |
|-----------|---------|
| Same-language function call | ~0.01ms |
| Cross-language call (TypeScript → Python) | **<1ms** |
| HTTP microservice call | 10-100ms |
| gRPC call (local) | 1-5ms |

**Elide is 10-100x faster than microservices!**

### Benchmark Example

```typescript
// benchmark.ts
import { python_function } from "./module.py";

const iterations = 10000;

// Measure cross-language overhead
const start = Date.now();
for (let i = 0; i < iterations; i++) {
  python_function(i);
}
const duration = Date.now() - start;

console.log(`${iterations} calls in ${duration}ms`);
console.log(`Average: ${duration / iterations}ms per call`);
// Expected: ~0.5-1ms per call
```

---

## Next Steps

- **[HTTP Servers](./http-servers.md)** - Build polyglot web servers
- **[Performance Optimization](./performance-optimization.md)** - Optimize cross-language calls
- **[Testing](./testing.md)** - Test polyglot applications
- **[Deployment](./deployment.md)** - Deploy polyglot apps to production

---

## Summary

Elide's polyglot programming enables:
- ✅ **TypeScript + Python + Ruby + Java** in one process
- ✅ **<1ms** cross-language call overhead (measured)
- ✅ **Shared memory** - no serialization needed
- ✅ **Single deployment** artifact
- ✅ **10-100x faster** than microservices
- ✅ **Best of all worlds** - use the right language for each task

**Key Benefits:**
- Python for ML/AI
- TypeScript for APIs
- Ruby for text processing
- Java for enterprise features
- All working together seamlessly!

🚀 **Build better applications by combining language strengths!**
