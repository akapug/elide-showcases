# Performance Optimization Guide

**Maximize Elide's performance potential for production workloads**

Elide is already 10x faster than Node.js for cold starts, but with the right techniques, you can achieve even better performance. This guide covers optimization strategies for all supported languages.

---

## Table of Contents

- [Performance Fundamentals](#performance-fundamentals)
- [Cold Start Optimization](#cold-start-optimization)
- [Runtime Performance](#runtime-performance)
- [Memory Optimization](#memory-optimization)
- [Polyglot Optimization](#polyglot-optimization)
- [HTTP Server Performance](#http-server-performance)
- [Language-Specific Tips](#language-specific-tips)
- [Profiling and Monitoring](#profiling-and-monitoring)
- [Benchmarking](#benchmarking)

---

## Performance Fundamentals

### Understanding Elide's Architecture

Elide runs on **GraalVM**, which provides:

1. **Fast Startup**: Optimized initialization (~20ms cold start)
2. **JIT Compilation**: Code gets faster as it runs (warmup)
3. **Ahead-of-Time (AOT)**: Optional pre-compilation for instant peak performance
4. **Polyglot**: Zero-overhead language interoperability
5. **Memory Efficiency**: Shared heap across languages

### Performance Characteristics

| Phase | Typical Performance |
|-------|---------------------|
| **Cold Start** | 20-50ms (10x faster than Node.js) |
| **Warmup** | 1-5 seconds (JIT compilation) |
| **Peak Performance** | Near-native speed |
| **Memory Footprint** | 50-200MB (vs 200-500MB for Node.js) |
| **Cross-Language Calls** | <1ms overhead |

---

## Cold Start Optimization

### 1. Minimize Module Evaluation

**Problem**: Code executed during module loading slows startup.

**❌ Bad** - Expensive initialization at module level:

```typescript
// server.ts
import { createServer } from "http";

// This runs immediately on startup
const data = expensiveComputation();  // Slows cold start!
const cache = buildLargeCache();      // Slows cold start!

const server = createServer((req, res) => {
  res.end(data);
});

server.listen(3000);
```

**✅ Good** - Lazy initialization:

```typescript
// server.ts
import { createServer } from "http";

let data: string | null = null;
let cache: Map<string, any> | null = null;

function getData() {
  if (!data) {
    data = expensiveComputation();  // Only runs when needed
  }
  return data;
}

const server = createServer((req, res) => {
  res.end(getData());
});

server.listen(3000);
```

### 2. Use Fetch Handler Pattern

The **Fetch Handler** pattern has the fastest cold start:

```typescript
// Fastest cold start pattern
export default async function fetch(req: Request): Promise<Response> {
  return new Response("Hello from Elide!");
}

// No module-level initialization needed!
```

Compare startup times:

```bash
# Fetch handler: ~20ms
time elide run fetch-server.ts

# Node.js http: ~30ms
time elide run http-server.ts

# Node.js (for comparison): ~200ms
time node server.js
```

### 3. Defer Imports

**❌ Bad** - Import everything upfront:

```typescript
import { createServer } from "http";
import { validateEmail } from "./validators.ts";
import { DatabaseClient } from "./db.ts";
import { Logger } from "./logger.ts";
import { Cache } from "./cache.ts";
// ... 20 more imports

export default async function fetch(req: Request): Promise<Response> {
  // Only uses 2 of those imports
  return new Response("OK");
}
```

**✅ Good** - Dynamic imports for rare paths:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Fast path - no imports needed
  if (url.pathname === "/health") {
    return new Response("OK");
  }

  // Slow path - import only when needed
  if (url.pathname === "/admin") {
    const { AdminHandler } = await import("./admin.ts");
    return AdminHandler(req);
  }

  return new Response("Not Found", { status: 404 });
}
```

### 4. Optimize Data Loading

**❌ Bad** - Load data at startup:

```typescript
// Loads 10MB of data on every cold start!
const productData = JSON.parse(readFileSync("products.json", "utf-8"));

export default async function fetch(req: Request): Promise<Response> {
  // Use productData...
}
```

**✅ Good** - Load on first request or use external cache:

```typescript
let productData: any = null;

export default async function fetch(req: Request): Promise<Response> {
  // Lazy load on first request
  if (!productData) {
    productData = await fetch("https://cdn.example.com/products.json")
      .then(r => r.json());
  }

  // Use productData...
}
```

---

## Runtime Performance

### 1. Warmup Awareness

GraalVM uses **JIT compilation** - code gets faster after warmup:

```typescript
// benchmark.ts
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Warmup phase
console.log("Warming up...");
for (let i = 0; i < 10000; i++) {
  fibonacci(20);
}

// Measurement phase
console.log("Measuring...");
const start = Date.now();
for (let i = 0; i < 10000; i++) {
  fibonacci(20);
}
const duration = Date.now() - start;
console.log(`Duration: ${duration}ms`);
console.log(`Per call: ${duration / 10000}ms`);
```

**Results**:
- First 1000 iterations: ~0.5ms per call (interpreted)
- After warmup: ~0.01ms per call (JIT compiled) - **50x faster!**

### 2. Avoid Dynamic Behavior

**JIT compilers optimize predictable code:**

**❌ Bad** - Dynamic types confuse JIT:

```typescript
function process(data: any) {
  // Type changes between calls - hard to optimize
  return data.value * 2;
}

process({ value: 10 });      // data is object
process({ value: "20" });    // data.value is string!
process([1, 2, 3]);          // data is array!
```

**✅ Good** - Consistent types:

```typescript
function process(data: { value: number }): number {
  // Type is consistent - JIT can optimize aggressively
  return data.value * 2;
}

process({ value: 10 });
process({ value: 20 });
process({ value: 30 });
```

### 3. Use Monomorphic Functions

**Monomorphic** = function always called with same type.

**❌ Bad** - Polymorphic (multiple types):

```typescript
function add(a: any, b: any) {
  return a + b;
}

add(1, 2);           // numbers
add("hello", " ");   // strings
add([1], [2]);       // arrays
// JIT gives up - too many types!
```

**✅ Good** - Monomorphic (single type):

```typescript
function addNumbers(a: number, b: number): number {
  return a + b;
}

function addStrings(a: string, b: string): string {
  return a + b;
}

// JIT can optimize both separately
addNumbers(1, 2);
addStrings("hello", " ");
```

### 4. Inline Small Functions

Small functions get inlined automatically:

```typescript
// This will be inlined by JIT
function square(x: number): number {
  return x * x;
}

function sumOfSquares(arr: number[]): number {
  let sum = 0;
  for (const x of arr) {
    sum += square(x);  // Inlined - no function call overhead
  }
  return sum;
}
```

### 5. Use Efficient Data Structures

**Arrays vs Objects:**

```typescript
// ✅ Fast - Array access
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];
const firstUser = users[0];  // O(1)

// ⚠️ Slower - Object lookup (still fast, but not as fast)
const userMap = {
  "1": { id: 1, name: "Alice" },
  "2": { id: 2, name: "Bob" }
};
const user = userMap["1"];  // Hash lookup
```

**Use TypedArray for numeric data:**

```typescript
// ✅ Fast - TypedArray (native memory)
const numbers = new Float64Array(1000000);
for (let i = 0; i < numbers.length; i++) {
  numbers[i] = Math.random();
}

// ❌ Slower - Regular array (boxed objects)
const slowNumbers = new Array(1000000);
for (let i = 0; i < slowNumbers.length; i++) {
  slowNumbers[i] = Math.random();
}
```

---

## Memory Optimization

### 1. Avoid Memory Leaks

**Common leak: Global caches without bounds:**

**❌ Bad** - Unbounded cache:

```typescript
const cache = new Map<string, any>();

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const key = url.pathname;

  if (!cache.has(key)) {
    cache.set(key, await expensiveOperation(key));
  }

  return new Response(JSON.stringify(cache.get(key)));
}
// Memory grows forever!
```

**✅ Good** - LRU cache with size limit:

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recent)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}

const cache = new LRUCache<string, any>(1000);  // Max 1000 entries
```

### 2. Reuse Objects

**Avoid creating unnecessary objects:**

**❌ Bad** - Creates new objects on every request:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "X-Custom-Header": "value"
  };

  return new Response(JSON.stringify({ ok: true }), { headers });
}
```

**✅ Good** - Reuse constant objects:

```typescript
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "X-Custom-Header": "value"
};

export default async function fetch(req: Request): Promise<Response> {
  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
}
```

### 3. Stream Large Responses

**Don't buffer entire response in memory:**

**❌ Bad** - Buffer entire file:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const data = await fetchLargeFile();  // 100MB in memory!
  return new Response(data);
}
```

**✅ Good** - Stream response:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const stream = await fetchLargeFileStream();
  return new Response(stream);  // Streams efficiently
}
```

---

## Polyglot Optimization

### 1. Minimize Cross-Language Calls

**❌ Bad** - Call Python in loop:

```typescript
import { process_item } from "./processor.py";

const items = Array.from({ length: 10000 }, (_, i) => i);

for (const item of items) {
  process_item(item);  // 10000 cross-language calls!
}
```

**✅ Good** - Batch process:

```typescript
import { process_batch } from "./processor.py";

const items = Array.from({ length: 10000 }, (_, i) => i);
const results = process_batch(items);  // 1 cross-language call
```

**Python implementation:**

```python
def process_batch(items):
    """Process all items in one call"""
    return [process_item(item) for item in items]
```

### 2. Use Native Implementations for Hot Paths

**Critical path in TypeScript:**

```typescript
// Hot path - called millions of times
function hash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

// Cold path - can use Python
import { complex_analysis } from "./analyzer.py";

export default async function fetch(req: Request): Promise<Response> {
  const id = hash(req.url);  // TypeScript - fast!

  if (req.url.includes("/analyze")) {
    // Python - complex but rare
    const result = complex_analysis(await req.text());
    return new Response(JSON.stringify(result));
  }

  return new Response(`Hash: ${id}`);
}
```

### 3. Cache Cross-Language Results

```typescript
import { expensive_ml_model } from "./model.py";

const predictionCache = new Map<string, any>();

export default async function fetch(req: Request): Promise<Response> {
  const data = await req.json();
  const cacheKey = JSON.stringify(data);

  // Check cache first
  if (predictionCache.has(cacheKey)) {
    return new Response(JSON.stringify(predictionCache.get(cacheKey)));
  }

  // Call Python only if needed
  const prediction = expensive_ml_model(data);
  predictionCache.set(cacheKey, prediction);

  return new Response(JSON.stringify(prediction));
}
```

---

## HTTP Server Performance

### 1. Choose the Right Server Pattern

**Fetch Handler** (fastest cold start):

```typescript
export default async function fetch(req: Request): Promise<Response> {
  return new Response("Fast!");
}
```

**Node.js http** (more control):

```typescript
import { createServer } from "http";

const server = createServer((req, res) => {
  res.end("Fast!");
});

server.listen(3000);
```

### 2. Avoid Blocking Operations

**❌ Bad** - Blocking I/O:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  // Blocks the entire server!
  const data = readFileSync("large-file.json", "utf-8");
  return new Response(data);
}
```

**✅ Good** - Async I/O:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  // Non-blocking
  const data = await fetch("https://api.example.com/data").then(r => r.text());
  return new Response(data);
}
```

### 3. Pre-compute Static Responses

```typescript
// Pre-compute static responses
const HEALTH_RESPONSE = new Response(JSON.stringify({ status: "healthy" }), {
  headers: { "Content-Type": "application/json" }
});

const NOT_FOUND_RESPONSE = new Response("Not Found", { status: 404 });

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return HEALTH_RESPONSE.clone();  // Reuse pre-computed response
  }

  if (url.pathname === "/api/data") {
    // Dynamic response
    return new Response(JSON.stringify({ data: generateData() }));
  }

  return NOT_FOUND_RESPONSE.clone();
}
```

### 4. Use Efficient Routing

**❌ Bad** - Regex for every route:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (/^\/users\/\d+$/.test(url.pathname)) {
    return handleUser(req);
  }
  if (/^\/posts\/\d+\/comments$/.test(url.pathname)) {
    return handleComments(req);
  }
  // ... 50 more regex matches

  return new Response("Not Found", { status: 404 });
}
```

**✅ Good** - Simple string checks first:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Fast paths first (no regex)
  if (path === "/health") return new Response("OK");
  if (path === "/") return new Response("Home");

  // Pattern matching only when needed
  if (path.startsWith("/users/")) {
    const userId = path.split("/")[2];
    return handleUser(userId);
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Language-Specific Tips

### TypeScript Optimization

```typescript
// ✅ Use const for better optimization
const MAX_USERS = 1000;

// ✅ Use type annotations
function processUser(user: User): ProcessedUser {
  // JIT knows exact types
  return { ...user, processed: true };
}

// ✅ Use for loops for hot paths (faster than forEach)
const sum = 0;
for (let i = 0; i < array.length; i++) {
  sum += array[i];
}

// ❌ Avoid 'any' type
function bad(x: any) {  // JIT can't optimize
  return x.value;
}
```

### Python Optimization

```python
# ✅ Use list comprehensions (optimized by GraalVM)
numbers = [x * 2 for x in range(1000)]

# ✅ Use built-in functions (implemented in native code)
total = sum(numbers)

# ❌ Avoid unnecessary object creation
# Bad:
result = []
for x in range(1000):
    result.append(str(x))

# Good:
result = [str(x) for x in range(1000)]

# ✅ Use tuples for immutable data (faster than lists)
coordinates = (10, 20)  # Tuple - faster
# vs
coordinates = [10, 20]  # List - slower
```

### Ruby Optimization

```ruby
# ✅ Use symbols instead of strings for keys
user = { name: "Alice", age: 30 }  # Symbols - faster

# ✅ Use blocks efficiently
numbers.map { |x| x * 2 }  # Optimized

# ✅ Freeze constants
CONSTANT_ARRAY = [1, 2, 3].freeze

# ❌ Avoid dynamic method definition in hot paths
# Bad:
define_method(:dynamic_method) { |x| x * 2 }
```

### Java Optimization

```java
// ✅ Use primitives when possible
int count = 0;  // Fast
// vs
Integer count = 0;  // Slower (boxed)

// ✅ Use StringBuilder for string concatenation
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String result = sb.toString();

// ✅ Use ArrayList with initial capacity
List<String> list = new ArrayList<>(1000);  // Pre-sized

// ❌ Avoid:
List<String> list = new ArrayList<>();  // Will resize multiple times
```

---

## Profiling and Monitoring

### Basic Performance Measurement

```typescript
// Simple timing
const start = Date.now();
const result = expensiveOperation();
const duration = Date.now() - start;
console.log(`Operation took ${duration}ms`);

// High-precision timing
const start = performance.now();
const result = expensiveOperation();
const duration = performance.now() - start;
console.log(`Operation took ${duration.toFixed(3)}ms`);
```

### Request Latency Tracking

```typescript
export default async function fetch(req: Request): Promise<Response> {
  const start = performance.now();

  const response = await handleRequest(req);

  const duration = performance.now() - start;
  console.log(`${req.method} ${new URL(req.url).pathname}: ${duration.toFixed(2)}ms`);

  return response;
}
```

### Memory Usage Monitoring

```typescript
// Log memory usage periodically
setInterval(() => {
  const used = process.memoryUsage();
  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`
  });
}, 60000);  // Every minute
```

---

## Benchmarking

### HTTP Server Benchmark

```bash
# Install Apache Bench
apt-get install apache2-utils  # Linux
brew install httpie  # macOS

# Benchmark
ab -n 10000 -c 100 http://localhost:3000/
# -n 10000: 10,000 requests
# -c 100: 100 concurrent connections

# Results show:
# - Requests per second
# - Time per request
# - Transfer rate
```

### Load Testing

```bash
# Using wrk (modern HTTP benchmarking tool)
wrk -t4 -c100 -d30s http://localhost:3000/
# -t4: 4 threads
# -c100: 100 connections
# -d30s: 30 seconds duration
```

### Application Benchmark Template

```typescript
// benchmark.ts
function benchmark(name: string, fn: () => void, iterations: number = 10000) {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    fn();
  }

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const duration = performance.now() - start;

  console.log(`${name}:`);
  console.log(`  Total: ${duration.toFixed(2)}ms`);
  console.log(`  Per call: ${(duration / iterations).toFixed(4)}ms`);
  console.log(`  Ops/sec: ${Math.round(iterations / (duration / 1000))}`);
}

// Usage
benchmark("String concat", () => {
  const s = "hello" + " " + "world";
}, 100000);

benchmark("Array push", () => {
  const arr: number[] = [];
  arr.push(1);
}, 100000);
```

---

## Next Steps

- **[Profiling Guide](./profiling.md)** - Deep dive into performance profiling
- **[HTTP Servers](./http-servers.md)** - Optimize HTTP server performance
- **[Debugging](./debugging.md)** - Debug performance issues
- **[Deployment](./deployment.md)** - Production optimization

---

## Summary

**Key Performance Strategies:**

1. **Cold Start**:
   - Use Fetch handler pattern
   - Minimize module-level code
   - Lazy initialization
   - Dynamic imports for rare paths

2. **Runtime**:
   - Allow warmup for JIT
   - Use consistent types
   - Inline small functions
   - Efficient data structures

3. **Memory**:
   - Bounded caches (LRU)
   - Reuse objects
   - Stream large data
   - Avoid leaks

4. **Polyglot**:
   - Batch cross-language calls
   - Cache results
   - Native code for hot paths

5. **HTTP**:
   - Pre-compute static responses
   - Async I/O only
   - Efficient routing
   - Connection pooling

**Expected Results:**
- ✅ Cold start: **20-50ms** (10x faster than Node.js)
- ✅ Peak throughput: **50,000+ req/s** (single core)
- ✅ Memory: **50-200MB** (vs 200-500MB Node.js)
- ✅ Cross-language: **<1ms** overhead

🚀 **Apply these optimizations to build blazing-fast Elide applications!**
