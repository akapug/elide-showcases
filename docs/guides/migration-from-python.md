# Migrating from Python to Elide

**Comprehensive guide for Python developers adopting Elide**

Learn how to leverage Python on Elide's polyglot runtime, combine Python with TypeScript, and migrate existing Python applications.

---

## Table of Contents

- [Why Use Python on Elide?](#why-use-python-on-elide)
- [Python Support Overview](#python-support-overview)
- [Running Python Code](#running-python-code)
- [Flask/Django Migration](#flaskdjango-migration)
- [Polyglot Patterns](#polyglot-patterns)
- [API Compatibility](#api-compatibility)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

---

## Why Use Python on Elide?

### Key Benefits

| Feature | CPython | Elide (GraalPython) |
|---------|---------|---------------------|
| **Startup Time** | ~300ms | ~20-50ms |
| **Performance** | Baseline | 2-10x faster (JIT) |
| **Polyglot** | subprocess/HTTP | <1ms in-process |
| **Memory** | Separate process | Shared with TypeScript/Ruby/Java |
| **Deployment** | Multiple artifacts | Single artifact |

### Use Cases

1. **ML/AI Services**: Run ML models with TypeScript API layer
2. **Data Processing**: Python analytics + TypeScript orchestration
3. **Migration Path**: Gradually move from Python to polyglot
4. **Existing Code**: Reuse Python libraries in TypeScript apps

---

## Python Support Overview

### GraalPython Compatibility

Elide uses **GraalPython**, which supports:

- ✅ **Python 3.11** syntax and features
- ✅ **Pure Python** standard library
- ✅ **Common packages** (limited C extensions)
- ✅ **WSGI apps** (Flask, Django)
- ⚠️ **NumPy/Pandas** (partial support)
- ❌ **Complex C extensions** (PyTorch, TensorFlow - limited)

### Running Python on Elide

```bash
# Run Python script
elide run script.py

# Run Flask app with WSGI
elide run --wsgi app.py

# Run polyglot (TypeScript imports Python)
elide run server.ts
```

---

## Running Python Code

### Standalone Python Script

```python
# hello.py
print("Hello from Python on Elide!")
print("Runtime: GraalVM")
print("Performance: 2-10x faster than CPython")

# Test execution
import time
start = time.time()

result = sum(i**2 for i in range(1000000))

duration = time.time() - start
print(f"Computed {result} in {duration:.4f}s")
```

Run it:
```bash
elide run hello.py
```

### Python Functions in TypeScript

**Python module** (`calculator.py`):

```python
def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

def calculate_stats(numbers):
    if not numbers:
        return {"count": 0, "sum": 0, "avg": 0}

    return {
        "count": len(numbers),
        "sum": sum(numbers),
        "avg": sum(numbers) / len(numbers),
        "min": min(numbers),
        "max": max(numbers)
    }

class Calculator:
    def __init__(self):
        self.history = []

    def compute(self, operation, a, b):
        if operation == "add":
            result = a + b
        elif operation == "multiply":
            result = a * b
        elif operation == "subtract":
            result = a - b
        elif operation == "divide":
            result = a / b if b != 0 else None
        else:
            result = None

        self.history.append({
            "operation": operation,
            "a": a,
            "b": b,
            "result": result
        })

        return result

    def get_history(self):
        return self.history
```

**TypeScript usage** (`server.ts`):

```typescript
import { createServer } from "http";
// Import Python functions directly!
import { add, multiply, calculate_stats, Calculator } from "./calculator.py";

const calc = new Calculator();

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname === "/add") {
    const a = parseFloat(url.searchParams.get("a") || "0");
    const b = parseFloat(url.searchParams.get("b") || "0");

    // Call Python function from TypeScript!
    const result = add(a, b);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ operation: "add", a, b, result }));
    return;
  }

  if (url.pathname === "/stats") {
    const numbers = url.searchParams.get("numbers")?.split(",").map(Number) || [];

    // Call Python function
    const stats = calculate_stats(numbers);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(stats));
    return;
  }

  if (url.pathname === "/compute" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      const data = JSON.parse(body);

      // Call Python class method
      const result = calc.compute(data.operation, data.a, data.b);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result }));
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, () => {
  console.log("Python + TypeScript server running on http://localhost:3000");
});
```

---

## Flask/Django Migration

### Flask Application

**Traditional Flask** (`app.py`):

```python
from flask import Flask, request, jsonify
import time

app = Flask(__name__)

# In-memory data store
users = [
    {"id": 1, "name": "Alice", "email": "alice@example.com"},
    {"id": 2, "name": "Bob", "email": "bob@example.com"}
]

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "runtime": "Flask on Elide"})

@app.route('/users')
def get_users():
    return jsonify(users)

@app.route('/users/<int:user_id>')
def get_user(user_id):
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user)

@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    new_user = {
        "id": len(users) + 1,
        "name": data.get("name"),
        "email": data.get("email")
    }
    users.append(new_user)
    return jsonify(new_user), 201

@app.route('/analyze', methods=['POST'])
def analyze():
    """Simulate ML analysis"""
    data = request.get_json()
    text = data.get("text", "")

    # Simple sentiment analysis
    positive_words = ["love", "great", "awesome", "excellent"]
    negative_words = ["hate", "bad", "awful", "terrible"]

    positive_count = sum(1 for word in positive_words if word in text.lower())
    negative_count = sum(1 for word in negative_words if word in text.lower())

    if positive_count > negative_count:
        sentiment = "positive"
    elif negative_count > positive_count:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    return jsonify({
        "text": text,
        "sentiment": sentiment,
        "positive_words": positive_count,
        "negative_words": negative_count
    })

if __name__ == '__main__':
    print("Run with: elide run --wsgi app.py")
```

**Run with Elide WSGI**:

```bash
# Native WSGI support in Elide beta11-rc1!
elide run --wsgi app.py

# Test it
curl http://localhost:5000/health
curl http://localhost:5000/users
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I love Elide! It is awesome!"}'
```

### Flask + TypeScript Polyglot

**Python Flask backend** (`ml_service.py`):

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

def analyze_sentiment(text):
    """ML sentiment analysis (simplified)"""
    positive_words = ["love", "great", "awesome", "excellent", "amazing"]
    negative_words = ["hate", "bad", "awful", "terrible", "horrible"]

    text_lower = text.lower()
    positive_score = sum(1 for word in positive_words if word in text_lower)
    negative_score = sum(1 for word in negative_words if word in text_lower)

    if positive_score > negative_score:
        return {
            "sentiment": "positive",
            "confidence": positive_score / (positive_score + negative_score + 1)
        }
    elif negative_score > positive_score:
        return {
            "sentiment": "negative",
            "confidence": negative_score / (positive_score + negative_score + 1)
        }
    else:
        return {
            "sentiment": "neutral",
            "confidence": 0.5
        }

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    text = data.get('text', '')
    result = analyze_sentiment(text)
    return jsonify(result)

# Export for polyglot import
model = {
    "analyze": analyze_sentiment
}

if __name__ == '__main__':
    print("Run Flask: elide run --wsgi ml_service.py")
    print("Or import in TypeScript for polyglot mode")
```

**TypeScript orchestration layer** (`server.ts`):

```typescript
import { createServer } from "http";
// Import Python model directly!
import { model } from "./ml_service.py";

interface AnalysisRequest {
  text: string;
  features?: string[];
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // Health check (TypeScript)
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "healthy",
      runtime: "Elide polyglot",
      languages: ["typescript", "python"]
    }));
    return;
  }

  // ML analysis (Python)
  if (url.pathname === "/api/analyze" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      const data: AnalysisRequest = JSON.parse(body);

      // Direct Python function call - <1ms overhead!
      const result = model.analyze(data.text);

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

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Polyglot server running on http://localhost:${PORT}`);
  console.log("Python ML + TypeScript API in ONE process!");
});
```

Run it:
```bash
elide run server.ts

# Test
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"I love Elide! It is awesome!"}'
```

---

## Polyglot Patterns

### Pattern 1: Python for ML, TypeScript for API

```typescript
// server.ts
import { createServer } from "http";
import { predict, train_model } from "./ml_model.py";

const server = createServer(async (req, res) => {
  if (req.url === "/predict" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      const data = JSON.parse(body);

      // Python ML inference
      const prediction = predict(data.features);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ prediction }));
    });
  }
});

server.listen(3000);
```

```python
# ml_model.py
def predict(features):
    """ML prediction logic"""
    # Your ML model here
    return {"class": "positive", "confidence": 0.95}

def train_model(data):
    """Training logic"""
    pass
```

### Pattern 2: Python for Data Processing

```python
# data_processor.py
def process_csv_data(csv_string):
    """Process CSV data"""
    lines = csv_string.strip().split('\n')
    headers = lines[0].split(',')

    rows = []
    for line in lines[1:]:
        values = line.split(',')
        row = dict(zip(headers, values))
        rows.append(row)

    return rows

def aggregate_data(data, group_by):
    """Aggregate data by field"""
    groups = {}
    for item in data:
        key = item.get(group_by)
        if key not in groups:
            groups[key] = []
        groups[key].append(item)

    return groups
```

```typescript
// server.ts
import { process_csv_data, aggregate_data } from "./data_processor.py";

export default async function fetch(req: Request): Promise<Response> {
  if (req.url.includes("/process") && req.method === "POST") {
    const csvData = await req.text();

    // Python data processing
    const processed = process_csv_data(csvData);
    const aggregated = aggregate_data(processed, "category");

    return new Response(JSON.stringify(aggregated));
  }

  return new Response("Not Found", { status: 404 });
}
```

### Pattern 3: Background Jobs in Python

```python
# jobs.py
import time
from threading import Thread

class BackgroundJob:
    def __init__(self):
        self.running = False
        self.results = []

    def start(self):
        if not self.running:
            self.running = True
            thread = Thread(target=self._run)
            thread.start()

    def _run(self):
        while self.running:
            # Do work
            result = self._process()
            self.results.append(result)
            time.sleep(5)

    def _process(self):
        # Your processing logic
        return {"timestamp": time.time(), "data": "processed"}

    def stop(self):
        self.running = False

    def get_results(self):
        return self.results

# Export for TypeScript
job = BackgroundJob()
```

```typescript
// server.ts
import { job } from "./jobs.py";

// Start Python background job
job.start();

export default async function fetch(req: Request): Promise<Response> {
  if (req.url.includes("/results")) {
    const results = job.get_results();
    return new Response(JSON.stringify(results));
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## API Compatibility

### Standard Library Support

**✅ Fully Supported**:
```python
# Built-ins
len(), sum(), map(), filter(), range()
list, dict, set, tuple
str, int, float, bool

# Standard modules
import json
import time
import datetime
import re
import os
import sys
import math
```

**⚠️ Partially Supported**:
```python
# Some features may be limited
import threading
import subprocess
import socket
```

**❌ Not Supported**:
```python
# C extension heavy packages
import numpy  # Limited support
import pandas  # Limited support
import torch  # Not supported
import tensorflow  # Not supported
```

### WSGI Compatibility

Flask and Django WSGI apps work natively:

```python
# Flask
from flask import Flask
app = Flask(__name__)

@app.route('/')
def index():
    return "Hello from Flask on Elide!"

# Run with: elide run --wsgi app.py
```

```python
# Django
# wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
application = get_wsgi_application()

# Run with: elide run --wsgi wsgi.py
```

---

## Common Patterns

### Error Handling Across Languages

```typescript
// server.ts
import { risky_python_function } from "./module.py";

export default async function fetch(req: Request): Promise<Response> {
  try {
    const result = risky_python_function();
    return new Response(JSON.stringify(result));
  } catch (error) {
    // Catch Python exceptions in TypeScript
    console.error("Python error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500 }
    );
  }
}
```

### Data Serialization

```python
# module.py
import json

def get_data():
    """Return data that TypeScript can consume"""
    return {
        "users": [{"id": 1, "name": "Alice"}],
        "count": 1,
        "active": True
    }

def process_data(data):
    """Accept data from TypeScript"""
    # data is automatically converted to Python dict
    return {
        "processed": True,
        "original_count": len(data),
        "result": data
    }
```

### Type Hints

```python
# typed_module.py
from typing import List, Dict, Optional

def process_users(users: List[Dict[str, str]]) -> Dict[str, int]:
    """Process users with type hints"""
    return {
        "count": len(users),
        "total_length": sum(len(u["name"]) for u in users)
    }

def find_user(user_id: int, users: List[Dict]) -> Optional[Dict]:
    """Find user by ID"""
    return next((u for u in users if u["id"] == user_id), None)
```

---

## Best Practices

### 1. Language Boundaries

**Keep Python focused on its strengths:**

```python
# ✅ Good: Python for data/ML
def analyze_data(data):
    # Complex data analysis
    return results

def train_model(dataset):
    # ML training
    return model
```

```typescript
// ✅ Good: TypeScript for API/orchestration
export default async function fetch(req: Request): Promise<Response> {
  const data = await req.json();
  const analysis = analyze_data(data);  // Python
  const formatted = formatResponse(analysis);  // TypeScript
  return new Response(JSON.stringify(formatted));
}
```

### 2. Performance Optimization

```python
# ✅ Batch operations in Python
def batch_process(items):
    return [process_item(item) for item in items]

# ❌ Avoid: Many small calls from TypeScript
# TypeScript calling process_item() 10000 times
```

### 3. Error Handling

```python
# module.py
class ValidationError(Exception):
    def __init__(self, message, code=None):
        self.message = message
        self.code = code
        super().__init__(message)

def validate_data(data):
    if not data:
        raise ValidationError("Data is required", "REQUIRED")
    if not isinstance(data, dict):
        raise ValidationError("Data must be a dictionary", "INVALID_TYPE")
    return True
```

```typescript
// server.ts
try {
  validate_data(data);
} catch (error: any) {
  return new Response(JSON.stringify({
    error: error.message,
    code: error.code
  }), { status: 400 });
}
```

### 4. Memory Management

```python
# ✅ Good: Generator for large datasets
def process_large_file(filename):
    with open(filename) as f:
        for line in f:
            yield process_line(line)

# ❌ Bad: Load everything into memory
def process_large_file_bad(filename):
    with open(filename) as f:
        lines = f.readlines()  # All in memory!
        return [process_line(line) for line in lines]
```

---

## Next Steps

- **[Polyglot Programming](./polyglot-programming.md)** - Multi-language patterns
- **[HTTP Servers](./http-servers.md)** - Build web services
- **[Performance Optimization](./performance-optimization.md)** - Speed optimization
- **[Testing](./testing.md)** - Test polyglot applications

---

## Summary

**Python on Elide Benefits:**

- ✅ **2-10x faster** than CPython (GraalVM JIT)
- ✅ **<1ms overhead** for TypeScript ↔ Python calls
- ✅ **Native WSGI** support (Flask, Django)
- ✅ **Shared memory** with TypeScript/Ruby/Java
- ✅ **Single deployment** artifact
- ✅ **Standard library** support

**Best Use Cases:**

1. **ML/AI**: Python models + TypeScript API
2. **Data Processing**: Python analytics + TypeScript orchestration
3. **Flask/Django**: Migrate existing apps with `--wsgi`
4. **Gradual Migration**: Keep Python, add TypeScript features

**Migration Path:**

1. Start: Run Flask/Django with `elide run --wsgi app.py`
2. Enhance: Add TypeScript API layer
3. Optimize: Move hot paths to TypeScript
4. Scale: Full polyglot application

🚀 **Leverage Python's ecosystem with Elide's performance!**
