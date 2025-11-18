# Polyglot Programming Guide

## FastAPI + Python + TypeScript = 🔥

This guide shows you how to leverage the **killer feature** of FastAPI on Elide: seamless Python + TypeScript integration.

## Table of Contents

1. [Why Polyglot?](#why-polyglot)
2. [Basic Concepts](#basic-concepts)
3. [Calling Python from TypeScript](#calling-python-from-typescript)
4. [Calling TypeScript from Python](#calling-typescript-from-python)
5. [Shared Data Models](#shared-data-models)
6. [Real-World Patterns](#real-world-patterns)
7. [Performance Considerations](#performance-considerations)
8. [Best Practices](#best-practices)

## Why Polyglot?

### The Problem

**Standard Python FastAPI:**
- Great for ML and data science
- Slower startup and execution
- Limited to Python ecosystem
- Can't leverage TypeScript's speed

**Standard TypeScript/Node.js:**
- Fast startup and execution
- Excellent async support
- Limited ML/data science libraries
- Can't leverage Python's ecosystem

### The Solution: Best of Both Worlds

**FastAPI on Elide:**
- Python for ML, data processing, scientific computing
- TypeScript for API layer, business logic, performance-critical code
- Zero-overhead language interop via GraalVM
- Single application, multiple languages

## Basic Concepts

### Language Roles

```
┌─────────────────────────────────────────┐
│          TypeScript Layer               │
│  - HTTP request handling                │
│  - Routing and middleware               │
│  - Business logic                       │
│  - Data transformation                  │
│  - API orchestration                    │
└──────────────┬──────────────────────────┘
               │ Zero-overhead calls
┌──────────────▼──────────────────────────┐
│          Python Layer                   │
│  - Machine learning inference           │
│  - Data science computations            │
│  - NumPy/Pandas operations              │
│  - scikit-learn/TensorFlow models       │
│  - Text processing (NLTK, spaCy)        │
└─────────────────────────────────────────┘
```

## Calling Python from TypeScript

### Setup

Create your Python module in `python/` directory:

```python
# python/ml_service.py
from typing import List, Dict, Any
import numpy as np

class MLService:
    @staticmethod
    def predict_sentiment(text: str) -> Dict[str, Any]:
        """Analyze sentiment using Python ML."""
        # Use actual ML model here (e.g., transformers)
        return {
            'sentiment': 'positive',
            'confidence': 0.95,
            'model': 'bert-base-uncased'
        }

    @staticmethod
    def calculate_statistics(numbers: List[float]) -> Dict[str, float]:
        """Calculate statistics using NumPy."""
        arr = np.array(numbers)
        return {
            'mean': float(np.mean(arr)),
            'median': float(np.median(arr)),
            'std': float(np.std(arr)),
            'min': float(np.min(arr)),
            'max': float(np.max(arr))
        }
```

### Import in TypeScript

```typescript
// Import Python module via Elide
import * as python from './python/ml_service.py';

const app = new FastAPI();

app.post('/analyze', async (req) => {
  // Call Python ML function
  const sentiment = await python.MLService.predict_sentiment(req.body.text);

  // Process result in TypeScript
  return {
    input: req.body.text,
    ...sentiment,
    timestamp: new Date().toISOString(),
  };
});
```

### Type Safety

Elide provides TypeScript type definitions for Python modules:

```typescript
// Type-safe Python imports
interface MLServiceType {
  predict_sentiment(text: string): Promise<{
    sentiment: string;
    confidence: number;
    model: string;
  }>;

  calculate_statistics(numbers: number[]): Promise<{
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  }>;
}

const MLService: MLServiceType = python.MLService;
```

## Calling TypeScript from Python

### TypeScript Module

```typescript
// typescript/business_logic.ts
export class BusinessLogic {
  static calculateDiscount(price: number, tier: string): number {
    const discounts = {
      bronze: 0.05,
      silver: 0.10,
      gold: 0.15,
      platinum: 0.20,
    };
    return price * (1 - (discounts[tier] || 0));
  }

  static formatResponse(data: any): any {
    return {
      ...data,
      formatted: true,
      timestamp: Date.now(),
      version: '1.0.0',
    };
  }
}
```

### Import in Python

```python
# python/order_processor.py
# Import TypeScript module via Elide
from typescript.business_logic import BusinessLogic

class OrderProcessor:
    @staticmethod
    def process_order(order_data: dict) -> dict:
        # Use Python for data validation
        validated = OrderProcessor.validate_order(order_data)

        # Use TypeScript for price calculation
        final_price = BusinessLogic.calculateDiscount(
            validated['price'],
            validated['customer_tier']
        )

        # Use TypeScript for formatting
        result = BusinessLogic.formatResponse({
            'order': validated,
            'final_price': final_price
        })

        return result
```

## Shared Data Models

### Pydantic Models (Python)

```python
# python/models.py
from pydantic import BaseModel, Field
from typing import List, Optional

class Product(BaseModel):
    id: int
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0)
    tags: List[str] = Field(default_factory=list)

class Order(BaseModel):
    id: int
    user_id: int
    products: List[Product]
    total: float
    status: str = Field(..., regex='^(pending|paid|shipped|delivered)$')
```

### Use in TypeScript

```typescript
// TypeScript can use Python Pydantic models
import { Product, Order } from './python/models.py';

app.post('/orders', async (req) => {
  // Validate using Python Pydantic model
  const order = Order.parse_obj(req.body);

  // Process in TypeScript
  const processed = processOrder(order);

  return processed;
});
```

### TypeScript Models

```typescript
// src/models.ts
import { createModel, Field } from '@elide/fastapi/models';

export const UserModel = createModel('User', {
  fields: {
    id: Field({ type: 'number' }),
    email: Field({ type: 'string', pattern: EMAIL_REGEX }),
    role: Field({ type: 'string', enum: ['admin', 'user'] }),
  },
});
```

### Use in Python

```python
# Python can use TypeScript models
from src.models import UserModel

def create_user(user_data: dict):
    # Validate using TypeScript model
    user = UserModel.parse_obj(user_data)
    return user.dict()
```

## Real-World Patterns

### Pattern 1: ML Inference API

**Use Case**: Serve ML models with high performance.

```typescript
import FastAPI from '@elide/fastapi';
import * as python from './python/ml_models.py';

const app = new FastAPI();

// TypeScript handles HTTP layer
app.post('/predict', async (req) => {
  const start = Date.now();

  // Python handles ML inference
  const prediction = await python.SentimentModel.predict(req.body.text);

  // TypeScript handles response formatting
  return {
    prediction: prediction.label,
    confidence: prediction.score,
    latency_ms: Date.now() - start,
    model_version: '1.0.0',
  };
});
```

**Why Polyglot?**
- TypeScript: Fast HTTP handling, minimal latency
- Python: ML models in native ecosystem
- Result: Best performance for both layers

### Pattern 2: Data Processing Pipeline

**Use Case**: Process data through multiple stages.

```typescript
import * as python from './python/data_processor.py';

app.post('/process', async (req) => {
  const data = req.body;

  // Stage 1: TypeScript data validation
  const validated = validateInput(data);

  // Stage 2: Python data cleaning
  const cleaned = await python.DataCleaner.clean(validated);

  // Stage 3: Python statistics
  const stats = await python.Statistics.analyze(cleaned);

  // Stage 4: TypeScript formatting
  const formatted = formatOutput(stats);

  return formatted;
});
```

**Why Polyglot?**
- TypeScript: Fast I/O validation
- Python: Advanced data processing (Pandas, NumPy)
- TypeScript: Fast response formatting

### Pattern 3: Business Logic + ML

**Use Case**: Combine business rules with ML predictions.

```typescript
import * as python from './python/ml.py';

app.post('/recommendations', async (req) => {
  const userId = req.body.user_id;

  // TypeScript: Get user data and business rules
  const user = await getUser(userId);
  const eligibleProducts = getEligibleProducts(user);

  // Python: ML-based recommendations
  const mlRecommendations = await python.RecommendationEngine.predict({
    user_id: userId,
    candidate_products: eligibleProducts,
  });

  // TypeScript: Apply business rules and discounts
  const finalRecommendations = mlRecommendations.map(rec => ({
    ...rec,
    price: calculatePrice(rec, user.tier),
    available: checkInventory(rec.product_id),
  }));

  return { recommendations: finalRecommendations };
});
```

**Why Polyglot?**
- TypeScript: Fast business logic, database access
- Python: ML models (collaborative filtering, etc.)
- TypeScript: Final price calculations and formatting

### Pattern 4: NLP + API

**Use Case**: Text processing with natural language understanding.

```typescript
import * as python from './python/nlp.py';

app.post('/analyze-document', async (req) => {
  const document = req.body.text;

  // Parallel Python NLP operations
  const [sentiment, entities, summary, keywords] = await Promise.all([
    python.NLP.analyze_sentiment(document),
    python.NLP.extract_entities(document),
    python.NLP.summarize(document),
    python.NLP.extract_keywords(document),
  ]);

  // TypeScript: Combine and format results
  return {
    document_length: document.length,
    analysis: {
      sentiment,
      entities,
      summary,
      keywords,
    },
    processed_at: new Date().toISOString(),
  };
});
```

**Why Polyglot?**
- Python: spaCy, NLTK, transformers for NLP
- TypeScript: Fast API layer and orchestration
- Parallel execution of Python tasks

### Pattern 5: Database + Data Science

**Use Case**: Query database, analyze with Python.

```typescript
import * as python from './python/analytics.py';

app.get('/analytics/sales', async (req) => {
  // TypeScript: Fast database queries
  const sales = await db.query(`
    SELECT * FROM sales
    WHERE date >= $1 AND date <= $2
  `, [req.query.start_date, req.query.end_date]);

  // Python: Advanced statistical analysis
  const analysis = await python.Analytics.analyze_sales(sales);

  // Python: Generate predictions
  const forecast = await python.Analytics.forecast_sales(analysis);

  // TypeScript: Format and return
  return {
    period: {
      start: req.query.start_date,
      end: req.query.end_date,
    },
    total_sales: sales.length,
    analysis,
    forecast,
  };
});
```

**Why Polyglot?**
- TypeScript: Efficient database queries
- Python: Pandas, scikit-learn for analysis
- TypeScript: API formatting

## Performance Considerations

### Call Overhead

| Call Type | Overhead | Notes |
|-----------|----------|-------|
| TypeScript → TypeScript | ~0.01ms | Native |
| Python → Python | ~0.01ms | Native |
| TypeScript → Python | ~0.05ms | GraalVM polyglot |
| Python → TypeScript | ~0.05ms | GraalVM polyglot |

Cross-language calls are **nearly zero overhead** thanks to GraalVM.

### Data Transfer

```typescript
// ✅ GOOD: Direct data transfer
const result = await python.analyze(data);

// ❌ BAD: Unnecessary serialization
const jsonData = JSON.stringify(data);
const result = await python.analyze(JSON.parse(jsonData));
```

GraalVM handles data conversion automatically - don't serialize manually!

### Async Considerations

```typescript
// ✅ GOOD: Parallel Python calls
const [result1, result2, result3] = await Promise.all([
  python.operation1(data),
  python.operation2(data),
  python.operation3(data),
]);

// ❌ BAD: Sequential Python calls
const result1 = await python.operation1(data);
const result2 = await python.operation2(data);
const result3 = await python.operation3(data);
```

### Memory Sharing

Objects are shared between languages, not copied:

```typescript
// Zero-copy data sharing
const largeArray = new Float64Array(1000000);

// Python can access TypeScript array directly
const stats = await python.calculate_stats(largeArray);
// No data copying occurred!
```

## Best Practices

### 1. Use Each Language for Its Strengths

✅ **DO**:
```typescript
// TypeScript for HTTP/API
app.post('/predict', async (req) => {
  // Python for ML
  const prediction = await python.model.predict(req.body.data);
  // TypeScript for formatting
  return formatResponse(prediction);
});
```

❌ **DON'T**:
```typescript
// Don't use Python for simple HTTP stuff
app.post('/hello', async (req) => {
  return await python.say_hello(); // Unnecessary Python call
});
```

### 2. Minimize Cross-Language Calls in Hot Paths

✅ **DO**:
```typescript
// Batch operations
const results = await python.batch_process(items);
```

❌ **DON'T**:
```typescript
// Many small calls
for (const item of items) {
  const result = await python.process(item); // Slow!
}
```

### 3. Use Type Safety

✅ **DO**:
```typescript
interface PythonMLService {
  predict(data: number[]): Promise<{ label: string; score: number }>;
}

const ml: PythonMLService = python.MLService;
```

❌ **DON'T**:
```typescript
const result = await python.something(data); // No type safety
```

### 4. Handle Errors Properly

✅ **DO**:
```typescript
try {
  const result = await python.operation(data);
  return result;
} catch (err) {
  if (err.type === 'ValidationError') {
    throw HTTPException(422, err.message);
  }
  throw HTTPException(500, 'Internal error');
}
```

### 5. Share Models Appropriately

```python
# python/models.py
from pydantic import BaseModel

class UserData(BaseModel):
    """Shared between Python and TypeScript"""
    id: int
    email: str
    preferences: dict
```

```typescript
// TypeScript can use Python models
import { UserData } from './python/models.py';

const user = UserData.parse_obj(req.body);
```

### 6. Optimize Data Transfer

✅ **DO**:
```typescript
// Transfer typed arrays (zero-copy)
const numbers = new Float64Array(data);
const stats = await python.calc(numbers);
```

❌ **DON'T**:
```typescript
// Transfer plain objects (requires serialization)
const stats = await python.calc(data.map(x => ({ value: x })));
```

## Example: Complete Polyglot Application

```typescript
// main.ts
import FastAPI from '@elide/fastapi';
import { CORSMiddleware } from '@elide/fastapi/middleware';
import * as python from './python/ml_service.py';

const app = new FastAPI({
  title: 'Polyglot ML API',
  description: 'Python ML + TypeScript API',
});

app.add_middleware(CORSMiddleware());

// TypeScript business logic
class BusinessLogic {
  static validateRequest(data: any): boolean {
    return data && data.text && data.text.length > 0;
  }

  static formatResponse(prediction: any, metadata: any): any {
    return {
      result: prediction,
      metadata,
      timestamp: new Date().toISOString(),
      api_version: '1.0.0',
    };
  }
}

// Polyglot endpoint
app.post('/analyze', async (req) => {
  // TypeScript validation
  if (!BusinessLogic.validateRequest(req.body)) {
    throw HTTPException(400, 'Invalid request');
  }

  const start = Date.now();

  // Python ML processing
  const [sentiment, entities, summary] = await Promise.all([
    python.NLP.analyze_sentiment(req.body.text),
    python.NLP.extract_entities(req.body.text),
    python.NLP.summarize(req.body.text),
  ]);

  // TypeScript formatting
  const response = BusinessLogic.formatResponse(
    { sentiment, entities, summary },
    { latency_ms: Date.now() - start }
  );

  return response;
});

app.listen(8000);
```

```python
# python/ml_service.py
from typing import Dict, List, Any
import spacy

nlp = spacy.load('en_core_web_sm')

class NLP:
    @staticmethod
    def analyze_sentiment(text: str) -> Dict[str, Any]:
        """Sentiment analysis using TextBlob"""
        from textblob import TextBlob
        blob = TextBlob(text)
        return {
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity,
            'label': 'positive' if blob.sentiment.polarity > 0 else 'negative'
        }

    @staticmethod
    def extract_entities(text: str) -> List[Dict[str, str]]:
        """Named entity recognition using spaCy"""
        doc = nlp(text)
        return [
            {'text': ent.text, 'label': ent.label_}
            for ent in doc.ents
        ]

    @staticmethod
    def summarize(text: str) -> str:
        """Text summarization"""
        sentences = text.split('.')
        return '. '.join(sentences[:3]) + '.'
```

## Troubleshooting

### Issue: Python Import Not Working

```typescript
// ❌ ERROR
import * as python from 'python/module.py';
```

**Solution**: Use relative path from project root:
```typescript
// ✅ CORRECT
import * as python from './python/module.py';
```

### Issue: Type Mismatch

```python
# Python returns numpy array
return np.array([1, 2, 3])
```

```typescript
// TypeScript expects plain array
const result: number[] = await python.func(); // Type error
```

**Solution**: Convert in Python:
```python
return np.array([1, 2, 3]).tolist()
```

### Issue: Async/Await Not Working

```python
# ❌ Regular function
def process(data):
    return result
```

**Solution**: Use async in Python:
```python
# ✅ Async function
async def process(data):
    return result
```

## Conclusion

Polyglot programming with FastAPI on Elide gives you:

- 🐍 Python's ML and data science ecosystem
- ⚡ TypeScript's performance and type safety
- 🔥 GraalVM's zero-overhead interop
- 🚀 Best-of-both-worlds architecture

Use each language for what it does best, and build applications that would be impossible in either language alone!

---

**Next Steps**:
- See [examples/polyglot-business-logic.ts](./examples/polyglot-business-logic.ts)
- See [examples/ml-inference-api.ts](./examples/ml-inference-api.ts)
- Read [BENCHMARKS.md](./BENCHMARKS.md) for performance data
