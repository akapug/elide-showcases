# RAG Service (Retrieval Augmented Generation)

A comprehensive RAG service built with Elide that combines document ingestion, semantic search, and LLM generation to provide accurate, context-aware responses grounded in your knowledge base.

## Reality Check

**Status:** Educational / Reference Implementation

**What This Is:**
- Complete RAG pipeline architecture from document ingestion to answer generation
- Production-ready chunking strategies with overlap for context preservation
- Demonstrates semantic search, context injection, and citation tracking
- Shows proper document management with CRUD operations and metadata handling

**What This Isn't:**
- Does not include actual embedding models (would be 80MB-500MB)
- Uses simulated vector embeddings and similarity calculations
- Requires real LLM integration for actual answer generation
- Vector search is basic cosine similarity, not optimized HNSW/FAISS

**To Make It Production-Ready:**
1. Integrate embedding models (sentence-transformers, OpenAI embeddings, etc.)
2. Add LLM integration (OpenAI, Anthropic, local models) for answer generation
3. Use proper vector database (Pinecone, Weaviate, Qdrant) for scale
4. Configure chunk size and retrieval parameters based on your domain

**Value:** Shows the complete RAG architecture including document processing, chunking strategies, vector search patterns, prompt construction with context, and citation tracking used by production Q&A systems like ChatGPT with retrieval.

## Overview

This showcase implements a production-ready RAG pipeline that demonstrates:

- **Document Ingestion** - Process and index documents
- **Intelligent Chunking** - Split text with overlap for context preservation
- **Embedding Generation** - Convert text to semantic vectors
- **Semantic Search** - Find relevant context using vector similarity
- **Context Injection** - Build prompts with retrieved information
- **LLM Generation** - Generate accurate, grounded responses
- **Citation Tracking** - Track sources for transparency

## Features

### Document Processing
- Text splitting with configurable chunk size and overlap
- Automatic embedding generation
- Metadata preservation
- Multi-document support

### Semantic Search
- Vector-based similarity search
- Configurable retrieval (top-K)
- Metadata filtering
- Relevance scoring

### Response Generation
- Context-aware LLM prompts
- Citation tracking
- Token usage monitoring
- Configurable temperature and max tokens

### Management
- CRUD operations for documents
- Document listing and retrieval
- Chunk inspection
- Statistics and monitoring

## Quick Start

### Prerequisites
- Elide CLI installed
- Documents or text to index

### Running the Service

```bash
# Start the service
elide run server.ts

# Service will start on http://localhost:8083
```

### Basic Usage

```bash
# Health check
curl http://localhost:8083/health

# Ingest documents
curl -X POST http://localhost:8083/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Elide is a high-performance polyglot runtime...",
        "metadata": {
          "source": "elide_docs.md",
          "title": "Elide Documentation"
        }
      }
    ],
    "chunkSize": 512,
    "chunkOverlap": 50
  }'

# Query with RAG
curl -X POST http://localhost:8083/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Elide?",
    "topK": 5,
    "generateResponse": true
  }'
```

## API Reference

### POST /v1/ingest

Ingest and index documents.

**Request:**
```json
{
  "documents": [
    {
      "content": "Your document content here...",
      "metadata": {
        "source": "document.pdf",
        "title": "Document Title",
        "author": "Author Name",
        "date": "2024-01-15"
      }
    }
  ],
  "chunkSize": 512,
  "chunkOverlap": 50
}
```

**Response:**
```json
{
  "success": true,
  "processed": 1,
  "chunks": 15
}
```

### POST /v1/query

Query the knowledge base with RAG.

**Request:**
```json
{
  "query": "What is retrieval augmented generation?",
  "topK": 5,
  "includeContext": true,
  "generateResponse": true,
  "temperature": 0.7,
  "maxTokens": 500,
  "filter": {
    "source": "rag_paper.pdf"
  }
}
```

**Response:**
```json
{
  "query": "What is retrieval augmented generation?",
  "answer": "Retrieval Augmented Generation (RAG) is a technique that combines information retrieval with language model generation...",
  "contexts": [
    {
      "content": "RAG is a method that retrieves relevant documents...",
      "score": 0.89,
      "source": "rag_paper.pdf",
      "metadata": {
        "title": "RAG Paper",
        "page": 3
      }
    }
  ],
  "citations": ["rag_paper.pdf"],
  "tokensUsed": 342
}
```

### GET /v1/documents

List all ingested documents.

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_1234567890_abc123",
      "metadata": {
        "source": "document.pdf",
        "title": "Document Title"
      },
      "chunks": 15,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

### GET /v1/documents/{id}

Get a specific document with all chunks.

**Response:**
```json
{
  "id": "doc_1234567890_abc123",
  "content": "Full document content...",
  "metadata": {
    "source": "document.pdf",
    "title": "Document Title"
  },
  "chunks": [
    {
      "id": "doc_1234567890_abc123_chunk_0",
      "documentId": "doc_1234567890_abc123",
      "content": "First chunk content...",
      "chunkIndex": 0,
      "metadata": {...}
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### DELETE /v1/documents/{id}

Delete a document and its chunks.

**Response:**
```json
{
  "success": true
}
```

### POST /v1/clear

Clear all documents and vectors.

**Response:**
```json
{
  "success": true
}
```

### GET /v1/stats

Get service statistics.

**Response:**
```json
{
  "documents": 12,
  "chunks": 187,
  "embeddingDimension": 384,
  "usage": {
    "queries": 453,
    "documentsIngested": 12,
    "totalTokens": 125430,
    "averageTokensPerQuery": 277
  }
}
```

### GET /health

Health check with service info.

**Response:**
```json
{
  "status": "healthy",
  "service": "RAG Service",
  "uptime": 3847.2,
  "documents": 12,
  "chunks": 187,
  "embeddingDimension": 384,
  "stats": {
    "queries": 453,
    "documentsIngested": 12
  }
}
```

## Usage Examples

### Building a Knowledge Base

```bash
# 1. Ingest documentation
curl -X POST http://localhost:8083/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "# Elide Overview\n\nElide is a fast polyglot runtime...",
        "metadata": {
          "source": "elide_overview.md",
          "category": "documentation"
        }
      },
      {
        "content": "# Getting Started\n\nTo get started with Elide...",
        "metadata": {
          "source": "getting_started.md",
          "category": "tutorial"
        }
      }
    ],
    "chunkSize": 400,
    "chunkOverlap": 40
  }'

# 2. Query the knowledge base
curl -X POST http://localhost:8083/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I get started with Elide?",
    "topK": 3,
    "generateResponse": true
  }'
```

### Customer Support Bot

```bash
# Ingest product documentation and FAQs
curl -X POST http://localhost:8083/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Q: How do I reset my password?\nA: Click on Forgot Password...",
        "metadata": {
          "source": "faq.md",
          "category": "authentication"
        }
      },
      {
        "content": "Product X features include...",
        "metadata": {
          "source": "product_docs.md",
          "category": "features"
        }
      }
    ]
  }'

# Query for customer questions
curl -X POST http://localhost:8083/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I forgot my password, what should I do?",
    "topK": 3
  }'
```

### Research Assistant

```bash
# Ingest research papers
curl -X POST http://localhost:8083/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "Abstract: This paper presents a novel approach to...",
        "metadata": {
          "source": "paper_2024.pdf",
          "title": "Novel Approach to X",
          "authors": ["Alice", "Bob"],
          "year": 2024
        }
      }
    ],
    "chunkSize": 600
  }'

# Ask research questions
curl -X POST http://localhost:8083/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main findings about X?",
    "topK": 10,
    "temperature": 0.3
  }'
```

### Code Documentation Search

```bash
# Index code documentation
curl -X POST http://localhost:8083/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "## API Reference\n\n### serve(options)\n\nStarts an HTTP server...",
        "metadata": {
          "source": "api_docs.md",
          "module": "http",
          "version": "1.0.0"
        }
      }
    ]
  }'

# Query for code examples
curl -X POST http://localhost:8083/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I start an HTTP server?",
    "filter": {
      "module": "http"
    }
  }'
```

## Integration Examples

### Python Client

```python
import requests

class RAGClient:
    def __init__(self, base_url="http://localhost:8083"):
        self.base_url = base_url

    def ingest(self, documents, chunk_size=512, chunk_overlap=50):
        response = requests.post(
            f"{self.base_url}/v1/ingest",
            json={
                "documents": documents,
                "chunkSize": chunk_size,
                "chunkOverlap": chunk_overlap
            }
        )
        return response.json()

    def query(self, question, top_k=5, generate=True, temperature=0.7):
        response = requests.post(
            f"{self.base_url}/v1/query",
            json={
                "query": question,
                "topK": top_k,
                "generateResponse": generate,
                "temperature": temperature
            }
        )
        return response.json()

    def list_documents(self):
        response = requests.get(f"{self.base_url}/v1/documents")
        return response.json()

# Usage
client = RAGClient()

# Ingest documents
client.ingest([
    {
        "content": "Your document content here...",
        "metadata": {"source": "doc1.txt", "category": "technical"}
    }
])

# Query
result = client.query("What is this document about?")
print(f"Answer: {result['answer']}")
print(f"Sources: {', '.join(result['citations'])}")
```

### TypeScript Client

```typescript
interface Document {
  content: string;
  metadata: Record<string, any>;
}

class RAGClient {
  constructor(private baseUrl = "http://localhost:8083") {}

  async ingest(documents: Document[], chunkSize = 512, chunkOverlap = 50) {
    const response = await fetch(`${this.baseUrl}/v1/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents,
        chunkSize,
        chunkOverlap
      })
    });
    return response.json();
  }

  async query(
    question: string,
    topK = 5,
    generateResponse = true,
    temperature = 0.7
  ) {
    const response = await fetch(`${this.baseUrl}/v1/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: question,
        topK,
        generateResponse,
        temperature
      })
    });
    return response.json();
  }

  async listDocuments() {
    const response = await fetch(`${this.baseUrl}/v1/documents`);
    return response.json();
  }
}

// Usage
const client = new RAGClient();

await client.ingest([
  {
    content: "Elide is a high-performance runtime...",
    metadata: { source: "elide.md" }
  }
]);

const result = await client.query("What is Elide?");
console.log("Answer:", result.answer);
console.log("Citations:", result.citations);
```

## Architecture

### RAG Pipeline Flow

1. **Ingestion**:
   - Documents → Text Splitter → Chunks
   - Chunks → Embedding Generator → Vectors
   - Vectors → Vector Store (indexed)

2. **Query**:
   - Query → Embedding Generator → Query Vector
   - Query Vector → Vector Store → Top-K Similar Chunks
   - Chunks + Query → Prompt Builder → Enhanced Prompt
   - Enhanced Prompt → LLM → Generated Answer

3. **Response**:
   - Answer + Context + Citations → User

### Components

- **TextSplitter**: Splits documents into overlapping chunks
- **EmbeddingGenerator**: Converts text to vectors
- **VectorStore**: Stores and searches embeddings
- **DocumentStore**: Manages document metadata and chunks
- **LLMGenerator**: Generates contextual responses
- **RAGPipeline**: Orchestrates the entire flow

## Performance Benefits with Elide

### Fast Processing
- Quick document ingestion
- Low-latency embedding generation
- Efficient vector search
- Rapid LLM inference

### Scalability
- Handle large document collections
- Process batch ingestions
- Concurrent query support
- Memory-efficient storage

### Polyglot Integration
- TypeScript for orchestration
- Can integrate Python embedding models
- Native LLM bindings
- Seamless library interop

### Resource Efficiency
- Low memory footprint
- Optimized vector operations
- Minimal startup overhead
- Suitable for edge deployment

## Production Integration

### Real Embedding Models

```typescript
// Example with Sentence Transformers
import { pipeline } from '@xenova/transformers';

class ProductionEmbedder {
  private model: any;

  async initialize() {
    this.model = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const output = await this.model(text, {
      pooling: 'mean',
      normalize: true
    });
    return Array.from(output.data);
  }
}
```

### Real LLM Integration

```typescript
// Example with OpenAI
import OpenAI from 'openai';

class ProductionLLM {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string, temperature = 0.7, maxTokens = 500) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    });

    return response.choices[0].message.content;
  }
}
```

### Advanced Features

1. **Hybrid Search**: Combine semantic and keyword search
2. **Reranking**: Use cross-encoders for better ranking
3. **Caching**: Cache frequent queries and embeddings
4. **Streaming**: Stream LLM responses in real-time
5. **Multi-modal**: Support images, audio, and other formats
6. **Fine-tuning**: Fine-tune embeddings for domain-specific use

## Best Practices

### Chunking Strategy
- **Size**: 256-512 tokens for most use cases
- **Overlap**: 10-20% of chunk size
- **Boundaries**: Split on sentences or paragraphs

### Retrieval Settings
- **Top-K**: 3-10 chunks typically sufficient
- **Threshold**: Filter low-similarity results (< 0.7)
- **Diversity**: Use MMR for diverse results

### Prompt Engineering
- Clear instructions to LLM
- Structured context formatting
- Explicit citation requirements
- Temperature: 0.0-0.3 for factual, 0.7-1.0 for creative

### Monitoring
- Track retrieval quality
- Monitor token usage
- Log failed queries
- A/B test prompts

## Use Cases

1. **Q&A Systems**: Answer questions from documentation
2. **Customer Support**: Automated support with knowledge base
3. **Research Tools**: Search academic papers and summarize findings
4. **Code Assistance**: Search code documentation and examples
5. **Legal/Compliance**: Query policies and regulations
6. **Education**: Tutoring systems with course materials
7. **Content Creation**: Research and fact-checking for writers

## Evaluation Metrics

- **Retrieval Accuracy**: % of relevant chunks retrieved
- **Answer Quality**: Human evaluation or LLM-as-judge
- **Latency**: Time from query to response
- **Citation Accuracy**: Correct source attribution
- **Token Efficiency**: Tokens used per query

## Why Elide?

This showcase demonstrates why Elide is ideal for RAG:

1. **Performance**: Fast document processing and query response
2. **Integration**: Easy to integrate ML models and libraries
3. **Efficiency**: Low overhead for embedding and search operations
4. **Scalability**: Handle growing knowledge bases efficiently
5. **Deployment**: Simple deployment with minimal dependencies

## License

MIT License - See LICENSE file for details

## Learn More

- [Elide Documentation](https://docs.elide.dev)
- [RAG Paper](https://arxiv.org/abs/2005.11401)
- [Vector Databases](https://www.pinecone.io/learn/vector-database/)
- [LangChain RAG](https://python.langchain.com/docs/use_cases/question_answering/)
