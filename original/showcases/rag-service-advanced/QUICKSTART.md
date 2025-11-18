# Quick Start Guide

Get the RAG service running in 5 minutes!

## Step 1: Install Dependencies

```bash
# Install Python dependencies
cd python
pip install -r requirements.txt
cd ..

# Install Node.js dependencies
npm install
```

## Step 2: Download Embedding Model

The first time you run the service, it will automatically download the embedding model (~80MB).

```bash
# Pre-download the model (optional)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

## Step 3: Start the Server

```bash
npm start
```

The server will be available at `http://localhost:3000`

## Step 4: Test It Out

### Ingest a Document

```bash
curl -X POST http://localhost:3000/api/v1/documents/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test_doc",
    "text": "Elide is a polyglot runtime that runs TypeScript and Python in a single process, eliminating network latency."
  }'
```

### Query

```bash
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Elide?",
    "topK": 3
  }'
```

## Step 5: Run Examples

```bash
# Basic RAG example
npm run example:basic

# Advanced patterns
npm run example:advanced

# Streaming responses
npm run example:streaming
```

## Step 6: Run Benchmarks

```bash
# Compare latency: Elide vs Microservices
npm run benchmark

# Throughput test
npm run benchmark:throughput
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out [docs/architecture.md](docs/architecture.md) for system design
- Run tests: `npm test`
- Explore the API endpoints in `src/api/routes.ts`

## Troubleshooting

### Python Module Not Found

```bash
# Make sure Python packages are installed
cd python
pip install -r requirements.txt
```

### Port Already in Use

```bash
# Change the port
PORT=3001 npm start
```

### Model Download Issues

```bash
# Pre-download the model
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Memory Issues

The embedding model requires ~500MB RAM. Ensure you have at least 2GB available.

---

**You're ready to go!** 🚀
