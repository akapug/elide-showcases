# Legacy Java Wrapper

**Enterprise Pattern**: Wrap legacy Java code with modern TypeScript APIs using Elide's polyglot capabilities.

## 🎯 Problem Statement

Many enterprises have decades-old Java codebases that are:
- Mission-critical but hard to modernize
- Lacking modern APIs
- Difficult to integrate with modern stacks
- Expensive to rewrite

## 💡 Solution

Use Elide to wrap Java code with TypeScript without:
- ❌ Rewriting the Java code
- ❌ JNI complexity
- ❌ Microservice overhead
- ❌ Serialization costs

## 🔥 Key Features

### Direct Java Imports
```typescript
import { LegacySystem } from "./LegacySystem.java";
const system = new LegacySystem();
const customers = system.getAllCustomers(); // <1ms call!
```

### Benefits
- **Zero Rewrite**: Keep existing Java code unchanged
- **Modern API**: Expose via TypeScript REST API
- **Single Process**: No microservices needed
- **Type Safety**: Full IDE support
- **Performance**: <1ms cross-language overhead

## 📂 Structure

```
legacy-java-wrapper/
├── LegacySystem.java   # Existing enterprise Java code
├── server.ts           # Modern TypeScript wrapper
└── README.md           # This file
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/legacy-java-wrapper
elide serve server.ts
```

## 📡 API Examples

### Get All Customers
```bash
curl http://localhost:3000/api/customers
```

### Get Customer Details
```bash
curl http://localhost:3000/api/customers/CUST001
```

### Process Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "amount": 1000.00,
    "type": "CREDIT"
  }'
```

### Generate Report
```bash
curl http://localhost:3000/api/reports/summary
```

## 🎓 Use Cases

1. **Gradual Migration**: Modernize APIs without rewriting logic
2. **API Modernization**: RESTful wrapper for legacy SOAP/RMI
3. **Cloud Migration**: Containerize legacy Java easily
4. **Integration**: Connect old systems to new architectures

## 📊 Performance

- **Cross-language calls**: <1ms overhead
- **Memory**: Single JVM process
- **Deployment**: One artifact (Java + TypeScript)
- **Cold start**: 10x faster than separate JVMs

## 🚀 Why This Matters

Traditional approaches require:
- Separate Java and Node.js processes (2x memory)
- REST/gRPC between services (10-50ms latency)
- Complex deployment orchestration

With Elide:
- One process, both languages
- Direct function calls (<1ms)
- Single deployment artifact

This is **true enterprise modernization** without the pain!
