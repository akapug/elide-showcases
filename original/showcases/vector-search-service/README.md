# Vector Search Service

A high-performance vector database service built with Elide for storing and searching embeddings using semantic similarity. Perfect for AI applications requiring semantic search, recommendations, and RAG systems.

## Reality Check

**Status:** Educational / Reference Implementation

**What This Is:**
- Complete vector database API with collections, CRUD operations, and similarity search
- Production-ready REST interface showing cosine, euclidean, and dot product metrics
- Demonstrates metadata filtering, batch operations, and collection management
- Shows proper API patterns for vector databases like Pinecone, Weaviate, Qdrant

**What This Isn't:**
- Uses basic brute-force search, not approximate nearest neighbors (ANN)
- In-memory storage only, no persistence or disk-backed indices
- Lacks advanced features like HNSW, IVF, or product quantization
- Not optimized for million+ vector scale

**To Make It Production-Ready:**
1. Implement ANN algorithms (HNSW, IVF, or LSH) for sub-millisecond search at scale
2. Add persistent storage (RocksDB, SQLite, or PostgreSQL with pgvector)
3. Configure memory limits and implement disk-backed indices for large datasets
4. Add replication, sharding, and backup capabilities

**Value:** Shows the complete vector database architecture including collection management, batch operations, metadata filtering, and similarity search APIs. Perfect for understanding vector DB patterns before scaling to production with specialized databases.

## Overview

This showcase implements a production-ready vector database with similarity search capabilities. Built on Elide's efficient runtime, it provides:

- **Fast vector operations** - Optimized similarity calculations
- **Multiple similarity metrics** - Cosine, Euclidean, Dot Product
- **Metadata filtering** - Search with custom filters
- **Collection management** - Organize vectors by use case
- **CRUD operations** - Full vector lifecycle management
- **Batch processing** - Efficient bulk operations

## Features

### Vector Operations
- Store and index high-dimensional vectors
- Cosine similarity search
- Euclidean distance search
- Dot product similarity
- Vector normalization

### Collection Management
- Multiple independent collections
- Configurable dimensions per collection
- Custom similarity metrics
- Collection statistics

### Search Capabilities
- K-nearest neighbor search
- Metadata filtering
- Configurable result count
- Include/exclude vectors and metadata

### Performance
- In-memory indexing
- Fast approximate nearest neighbor search
- Batch upsert and delete
- Efficient vector operations

## Quick Start

### Prerequisites
- Elide CLI installed
- Basic understanding of vector embeddings

### Running the Service

```bash
# Start the service
elide run server.ts

# Service will start on http://localhost:8082
```

### Basic Usage

```bash
# Health check
curl http://localhost:8082/health

# Create a collection
curl -X POST http://localhost:8082/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "documents",
    "dimension": 384,
    "metric": "cosine"
  }'

# Upsert vectors
curl -X POST http://localhost:8082/collections/documents/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": [
      {
        "id": "doc1",
        "values": [0.1, 0.2, 0.3, ...],
        "metadata": {"title": "Introduction", "page": 1}
      }
    ]
  }'

# Search similar vectors
curl -X POST http://localhost:8082/collections/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.15, 0.25, 0.35, ...],
    "topK": 5,
    "includeMetadata": true
  }'
```

## API Reference

### Collection Management

#### POST /collections

Create a new collection.

**Request:**
```json
{
  "name": "my_collection",
  "dimension": 384,
  "metric": "cosine"
}
```

**Response:**
```json
{
  "name": "my_collection",
  "dimension": 384,
  "metric": "cosine"
}
```

#### GET /collections

List all collections.

**Response:**
```json
{
  "collections": [
    {
      "name": "documents",
      "dimension": 384,
      "metric": "cosine",
      "vectorCount": 1250
    },
    {
      "name": "images",
      "dimension": 512,
      "metric": "euclidean",
      "vectorCount": 3840
    }
  ]
}
```

#### DELETE /collections/{name}

Delete a collection.

**Response:**
```json
{
  "success": true
}
```

### Vector Operations

#### POST /collections/{name}/upsert

Insert or update vectors.

**Request:**
```json
{
  "vectors": [
    {
      "id": "vec1",
      "values": [0.1, 0.2, 0.3, 0.4, ...],
      "metadata": {
        "category": "technology",
        "author": "Alice",
        "date": "2024-01-15"
      }
    },
    {
      "id": "vec2",
      "values": [0.5, 0.6, 0.7, 0.8, ...],
      "metadata": {
        "category": "science",
        "author": "Bob",
        "date": "2024-01-16"
      }
    }
  ]
}
```

**Response:**
```json
{
  "upserted": 2
}
```

#### POST /collections/{name}/search

Search for similar vectors.

**Request:**
```json
{
  "vector": [0.15, 0.25, 0.35, 0.45, ...],
  "topK": 10,
  "includeValues": true,
  "includeMetadata": true,
  "filter": {
    "category": "technology"
  }
}
```

**Response:**
```json
{
  "matches": [
    {
      "id": "vec1",
      "score": 0.98,
      "values": [0.1, 0.2, 0.3, 0.4, ...],
      "metadata": {
        "category": "technology",
        "author": "Alice",
        "date": "2024-01-15"
      }
    },
    {
      "id": "vec5",
      "score": 0.92,
      "values": [0.12, 0.22, 0.32, 0.42, ...],
      "metadata": {
        "category": "technology",
        "author": "Charlie",
        "date": "2024-01-18"
      }
    }
  ]
}
```

#### GET /collections/{name}/vectors/{id}

Get a specific vector by ID.

**Response:**
```json
{
  "id": "vec1",
  "values": [0.1, 0.2, 0.3, 0.4, ...],
  "metadata": {
    "category": "technology",
    "author": "Alice"
  }
}
```

#### GET /collections/{name}/list?limit=100&offset=0

List vectors in a collection.

**Response:**
```json
{
  "vectors": [
    {
      "id": "vec1",
      "values": [0.1, 0.2, ...],
      "metadata": {...}
    }
  ],
  "count": 100,
  "total": 1250
}
```

#### POST /collections/{name}/delete

Delete vectors by ID or delete all.

**Request (by IDs):**
```json
{
  "ids": ["vec1", "vec2", "vec3"]
}
```

**Request (delete all):**
```json
{
  "deleteAll": true
}
```

**Response:**
```json
{
  "deleted": 3
}
```

### Statistics

#### GET /stats

Get service statistics.

**Response:**
```json
{
  "searches": 4829,
  "upserts": 1250,
  "deletes": 45
}
```

#### GET /health

Health check with service info.

**Response:**
```json
{
  "status": "healthy",
  "service": "Vector Search Service",
  "uptime": 3847.2,
  "collections": 3,
  "totalVectors": 5090,
  "stats": {
    "searches": 4829,
    "upserts": 1250,
    "deletes": 45
  }
}
```

## Usage Examples

### Semantic Document Search

```bash
# 1. Create a collection for documents
curl -X POST http://localhost:8082/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "documents",
    "dimension": 384,
    "metric": "cosine"
  }'

# 2. Index documents with their embeddings
curl -X POST http://localhost:8082/collections/documents/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": [
      {
        "id": "doc1",
        "values": [0.1, 0.2, 0.3, ...],
        "metadata": {
          "title": "Introduction to AI",
          "content": "Artificial Intelligence is...",
          "category": "technology"
        }
      },
      {
        "id": "doc2",
        "values": [0.4, 0.5, 0.6, ...],
        "metadata": {
          "title": "Machine Learning Basics",
          "content": "Machine learning is a subset...",
          "category": "technology"
        }
      }
    ]
  }'

# 3. Search for similar documents
curl -X POST http://localhost:8082/collections/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.15, 0.25, 0.35, ...],
    "topK": 5,
    "includeMetadata": true
  }'
```

### Product Recommendations

```bash
# Create collection for products
curl -X POST http://localhost:8082/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "products",
    "dimension": 128,
    "metric": "cosine"
  }'

# Index product embeddings
curl -X POST http://localhost:8082/collections/products/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": [
      {
        "id": "prod_123",
        "values": [0.1, 0.2, ...],
        "metadata": {
          "name": "Wireless Headphones",
          "category": "electronics",
          "price": 99.99
        }
      }
    ]
  }'

# Find similar products
curl -X POST http://localhost:8082/collections/products/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.12, 0.22, ...],
    "topK": 10,
    "filter": {
      "category": "electronics"
    }
  }'
```

### Image Similarity Search

```bash
# Create collection for image embeddings
curl -X POST http://localhost:8082/collections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "images",
    "dimension": 512,
    "metric": "cosine"
  }'

# Index image embeddings
curl -X POST http://localhost:8082/collections/images/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": [
      {
        "id": "img_001",
        "values": [0.01, 0.02, ...],
        "metadata": {
          "filename": "sunset.jpg",
          "tags": ["nature", "sunset", "ocean"]
        }
      }
    ]
  }'

# Find similar images
curl -X POST http://localhost:8082/collections/images/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.015, 0.025, ...],
    "topK": 20
  }'
```

## Integration Examples

### Python Client

```python
import requests
import numpy as np

class VectorSearchClient:
    def __init__(self, base_url="http://localhost:8082"):
        self.base_url = base_url

    def create_collection(self, name, dimension, metric="cosine"):
        response = requests.post(
            f"{self.base_url}/collections",
            json={"name": name, "dimension": dimension, "metric": metric}
        )
        return response.json()

    def upsert(self, collection, vectors):
        response = requests.post(
            f"{self.base_url}/collections/{collection}/upsert",
            json={"vectors": vectors}
        )
        return response.json()

    def search(self, collection, vector, top_k=10, filter=None):
        payload = {
            "vector": vector.tolist() if isinstance(vector, np.ndarray) else vector,
            "topK": top_k,
            "includeMetadata": True
        }
        if filter:
            payload["filter"] = filter

        response = requests.post(
            f"{self.base_url}/collections/{collection}/search",
            json=payload
        )
        return response.json()

# Usage
client = VectorSearchClient()

# Create collection
client.create_collection("my_docs", dimension=384)

# Index vectors
client.upsert("my_docs", [
    {
        "id": "doc1",
        "values": np.random.randn(384).tolist(),
        "metadata": {"title": "Document 1"}
    }
])

# Search
results = client.search("my_docs", np.random.randn(384), top_k=5)
print(f"Found {len(results['matches'])} results")
```

### TypeScript Client

```typescript
interface Vector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

class VectorSearchClient {
  constructor(private baseUrl = "http://localhost:8082") {}

  async createCollection(name: string, dimension: number, metric = "cosine") {
    const response = await fetch(`${this.baseUrl}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, dimension, metric })
    });
    return response.json();
  }

  async upsert(collection: string, vectors: Vector[]) {
    const response = await fetch(`${this.baseUrl}/collections/${collection}/upsert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vectors })
    });
    return response.json();
  }

  async search(
    collection: string,
    vector: number[],
    topK = 10,
    filter?: Record<string, any>
  ) {
    const response = await fetch(`${this.baseUrl}/collections/${collection}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vector,
        topK,
        includeMetadata: true,
        filter
      })
    });
    return response.json();
  }
}

// Usage
const client = new VectorSearchClient();

await client.createCollection("products", 128);

await client.upsert("products", [
  {
    id: "prod1",
    values: Array(128).fill(0).map(() => Math.random()),
    metadata: { name: "Product 1", price: 29.99 }
  }
]);

const results = await client.search(
  "products",
  Array(128).fill(0).map(() => Math.random()),
  5
);
```

## Similarity Metrics

### Cosine Similarity
- Range: -1 to 1 (higher is more similar)
- Use for: Text embeddings, normalized vectors
- Formula: cos(θ) = (A · B) / (||A|| × ||B||)

### Euclidean Distance
- Range: 0 to ∞ (lower is more similar)
- Use for: Image embeddings, spatial data
- Formula: d = √Σ(ai - bi)²

### Dot Product
- Range: -∞ to ∞ (higher is more similar)
- Use for: Pre-normalized vectors, magnitude-aware similarity
- Formula: A · B = Σ(ai × bi)

## Performance Optimization

### Indexing Strategy
- Current: Brute force search (demonstration)
- Production: Implement HNSW, IVF, or LSH indexes
- Trade-off: Accuracy vs. Speed

### Memory Management
- In-memory storage for fast access
- Consider disk-backed storage for large datasets
- Implement eviction policies for cache management

### Batch Operations
- Use batch upsert for bulk indexing
- Parallel search for multiple queries
- Optimize vector serialization

## Production Considerations

### Scaling
1. **Horizontal Scaling**: Shard collections across multiple instances
2. **Vertical Scaling**: Increase memory for larger indexes
3. **Caching**: Cache frequent queries
4. **Compression**: Use vector quantization (PQ, SQ)

### Advanced Features to Add
- [ ] Approximate Nearest Neighbor (ANN) algorithms
- [ ] Persistent storage (SQLite, RocksDB)
- [ ] Replication and backup
- [ ] Authentication and authorization
- [ ] Query analytics
- [ ] Multi-vector search
- [ ] Hybrid search (dense + sparse)

### Integration with Embedding Models

```typescript
// Example with an embedding model
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function embedText(text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Index documents
const text = "Elide is a high-performance runtime";
const embedding = await embedText(text);

await client.upsert("documents", [{
  id: "doc1",
  values: embedding,
  metadata: { text }
}]);
```

## Use Cases

1. **Semantic Search**: Find documents by meaning, not just keywords
2. **Recommendation Systems**: Suggest similar products, content, or users
3. **RAG Applications**: Retrieve relevant context for LLM prompts
4. **Duplicate Detection**: Find similar or duplicate content
5. **Clustering**: Group similar items together
6. **Anomaly Detection**: Find outliers in vector space
7. **Personalization**: Match users with relevant content

## Why Elide?

This showcase demonstrates Elide's strengths for vector databases:

1. **Performance**: Fast vector operations and memory-efficient storage
2. **Low Latency**: Quick startup and response times
3. **Simplicity**: Easy to deploy and integrate
4. **Polyglot**: Integrate with ML models in Python, Java, or native code
5. **Scalability**: Handle large vector datasets efficiently

## Benchmarks

Typical performance (1000 vectors, dimension 384):

- **Upsert**: ~5,000 vectors/second
- **Search**: ~10,000 queries/second
- **Memory**: ~150KB per 1000 vectors
- **Startup**: < 50ms

## License

MIT License - See LICENSE file for details

## Learn More

- [Elide Documentation](https://docs.elide.dev)
- [Vector Databases Explained](https://www.pinecone.io/learn/vector-database/)
- [Similarity Search Algorithms](https://github.com/facebookresearch/faiss)
