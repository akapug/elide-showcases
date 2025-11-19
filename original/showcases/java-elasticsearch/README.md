# Java Elasticsearch Client + TypeScript API

**Enterprise Pattern**: Java Elasticsearch client with modern TypeScript REST API.

## 🎯 Use Case

Search-driven applications need:
- Robust Elasticsearch client (Java ecosystem)
- Modern REST API (TypeScript)
- Low latency search
- Single deployment

## 💡 Solution

```typescript
import { ElasticsearchClient } from "./ElasticsearchClient.java";
const results = esClient.search("products", "laptop");
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/java-elasticsearch
elide serve server.ts
```

## 📡 Examples

### Create Index
```bash
curl -X PUT http://localhost:3000/api/indices/products
```

### Index Document
```bash
curl -X POST http://localhost:3000/api/products/_doc \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "price": 999}'
```

### Search
```bash
curl -X POST http://localhost:3000/api/products/_search \
  -H "Content-Type: application/json" \
  -d '{"query": {"match": {"query": "laptop"}}}'
```

Perfect for search-powered applications!
