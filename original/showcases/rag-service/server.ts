/**
 * RAG (Retrieval Augmented Generation) Service
 *
 * A comprehensive RAG service built with Elide that combines document ingestion,
 * embedding generation, semantic search, and LLM generation to provide accurate,
 * context-aware responses.
 *
 * Features:
 * - Document ingestion (text, PDF, markdown)
 * - Automatic text chunking and splitting
 * - Embedding generation
 * - Vector storage and semantic search
 * - Context injection into prompts
 * - LLM response generation
 * - Citation tracking
 * - Multi-document support
 */

// Native Elide beta11-rc1 HTTP - No imports needed for fetch handler

// Types
interface Document {
  id: string;
  content: string;
  metadata: {
    source: string;
    title?: string;
    author?: string;
    date?: string;
    [key: string]: any;
  };
  chunks?: DocumentChunk[];
  createdAt: Date;
}

interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  chunkIndex: number;
}

interface IngestRequest {
  documents: Array<{
    content: string;
    metadata: Record<string, any>;
  }>;
  chunkSize?: number;
  chunkOverlap?: number;
}

interface QueryRequest {
  query: string;
  topK?: number;
  filter?: Record<string, any>;
  includeContext?: boolean;
  generateResponse?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface QueryResponse {
  query: string;
  answer?: string;
  contexts: Array<{
    content: string;
    score: number;
    source: string;
    metadata: Record<string, any>;
  }>;
  citations?: string[];
  tokensUsed?: number;
}

// Text Splitter
class TextSplitter {
  constructor(
    private chunkSize: number = 512,
    private chunkOverlap: number = 50
  ) {}

  splitText(text: string): string[] {
    const chunks: string[] = [];
    const sentences = this.splitIntoSentences(text);

    let currentChunk = "";
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > this.chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());

        // Handle overlap
        const words = currentChunk.split(" ");
        const overlapWords = words.slice(-Math.floor(this.chunkOverlap / 5));
        currentChunk = overlapWords.join(" ") + " ";
        currentLength = currentChunk.length;
      }

      currentChunk += sentence + " ";
      currentLength += sentenceLength + 1;
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting (can be enhanced with NLP)
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}

// Embedding Generator (Simulated)
class EmbeddingGenerator {
  private dimension = 384;

  async generateEmbedding(text: string): Promise<number[]> {
    // Simulate embedding generation
    // In production, use models like sentence-transformers, OpenAI embeddings, etc.
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Generate deterministic embeddings based on text content
    const embedding = new Array(this.dimension).fill(0);
    for (let i = 0; i < text.length && i < this.dimension; i++) {
      embedding[i % this.dimension] += text.charCodeAt(i) / 10000;
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / (norm || 1));
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.generateEmbedding(text)));
  }

  getDimension(): number {
    return this.dimension;
  }
}

// Vector Store
class VectorStore {
  private vectors: Map<string, { embedding: number[]; metadata: any }> = new Map();

  add(id: string, embedding: number[], metadata: any): void {
    this.vectors.set(id, { embedding, metadata });
  }

  addBatch(items: Array<{ id: string; embedding: number[]; metadata: any }>): void {
    for (const item of items) {
      this.add(item.id, item.embedding, item.metadata);
    }
  }

  search(queryEmbedding: number[], topK: number = 5): Array<{ id: string; score: number; metadata: any }> {
    const results: Array<{ id: string; score: number; metadata: any }> = [];

    for (const [id, { embedding, metadata }] of this.vectors.entries()) {
      const score = this.cosineSimilarity(queryEmbedding, embedding);
      results.push({ id, score, metadata });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  delete(id: string): boolean {
    return this.vectors.delete(id);
  }

  clear(): void {
    this.vectors.clear();
  }

  size(): number {
    return this.vectors.size;
  }
}

// Document Store
class DocumentStore {
  private documents: Map<string, Document> = new Map();
  private chunks: Map<string, DocumentChunk> = new Map();

  addDocument(document: Document): void {
    this.documents.set(document.id, document);

    if (document.chunks) {
      for (const chunk of document.chunks) {
        this.chunks.set(chunk.id, chunk);
      }
    }
  }

  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  getChunk(id: string): DocumentChunk | undefined {
    return this.chunks.get(id);
  }

  listDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  deleteDocument(id: string): boolean {
    const document = this.documents.get(id);
    if (!document) return false;

    // Delete chunks
    if (document.chunks) {
      for (const chunk of document.chunks) {
        this.chunks.delete(chunk.id);
      }
    }

    return this.documents.delete(id);
  }

  clear(): void {
    this.documents.clear();
    this.chunks.clear();
  }
}

// LLM Generator (Simulated)
class LLMGenerator {
  async generate(prompt: string, temperature: number = 0.7, maxTokens: number = 500): Promise<string> {
    // Simulate LLM generation
    // In production, integrate with actual LLM APIs (OpenAI, Anthropic, local models, etc.)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Extract query from prompt
    const queryMatch = prompt.match(/Question: (.+?)(?:\n|Context:)/);
    const query = queryMatch ? queryMatch[1].trim() : "";

    // Generate a contextual response
    const response = `Based on the provided context, I can help answer your question about "${query}". ` +
      `The documents indicate relevant information about this topic. ` +
      `This demonstrates how Elide's RAG service combines document retrieval with LLM generation ` +
      `to provide accurate, context-aware responses. The service retrieves the most relevant ` +
      `chunks from the knowledge base and uses them to ground the LLM's response, ` +
      `reducing hallucinations and improving accuracy.`;

    return response;
  }

  countTokens(text: string): number {
    // Approximate token count
    return Math.ceil(text.length / 4);
  }
}

// RAG Pipeline
class RAGPipeline {
  private documentStore: DocumentStore;
  private vectorStore: VectorStore;
  private embedder: EmbeddingGenerator;
  private llm: LLMGenerator;
  private splitter: TextSplitter;

  constructor() {
    this.documentStore = new DocumentStore();
    this.vectorStore = new VectorStore();
    this.embedder = new EmbeddingGenerator();
    this.llm = new LLMGenerator();
    this.splitter = new TextSplitter();
  }

  async ingestDocuments(request: IngestRequest): Promise<{ processed: number; chunks: number }> {
    let totalChunks = 0;

    if (request.chunkSize) {
      this.splitter = new TextSplitter(request.chunkSize, request.chunkOverlap || 50);
    }

    for (const docData of request.documents) {
      const documentId = this.generateId();

      // Split into chunks
      const chunks = this.splitter.splitText(docData.content);
      totalChunks += chunks.length;

      // Create document chunks
      const documentChunks: DocumentChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${documentId}_chunk_${i}`;
        const chunkContent = chunks[i];

        // Generate embedding
        const embedding = await this.embedder.generateEmbedding(chunkContent);

        const chunk: DocumentChunk = {
          id: chunkId,
          documentId,
          content: chunkContent,
          embedding,
          metadata: {
            ...docData.metadata,
            chunkIndex: i,
            totalChunks: chunks.length,
          },
          chunkIndex: i,
        };

        documentChunks.push(chunk);

        // Add to vector store
        this.vectorStore.add(chunkId, embedding, {
          content: chunkContent,
          documentId,
          source: docData.metadata.source || "unknown",
          ...docData.metadata,
        });
      }

      // Create and store document
      const document: Document = {
        id: documentId,
        content: docData.content,
        metadata: docData.metadata,
        chunks: documentChunks,
        createdAt: new Date(),
      };

      this.documentStore.addDocument(document);
    }

    return { processed: request.documents.length, chunks: totalChunks };
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    // Generate query embedding
    const queryEmbedding = await this.embedder.generateEmbedding(request.query);

    // Search for relevant chunks
    const topK = request.topK || 5;
    const results = this.vectorStore.search(queryEmbedding, topK);

    // Format contexts
    const contexts = results.map((r) => ({
      content: r.metadata.content,
      score: r.score,
      source: r.metadata.source || "unknown",
      metadata: r.metadata,
    }));

    // Build response
    const response: QueryResponse = {
      query: request.query,
      contexts,
    };

    // Generate LLM response if requested
    if (request.generateResponse !== false) {
      const contextText = contexts.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");

      const prompt = this.buildPrompt(request.query, contextText);
      const answer = await this.llm.generate(
        prompt,
        request.temperature || 0.7,
        request.maxTokens || 500
      );

      response.answer = answer;
      response.citations = contexts.map((c) => c.source);
      response.tokensUsed = this.llm.countTokens(prompt + answer);
    }

    return response;
  }

  private buildPrompt(query: string, context: string): string {
    return `You are a helpful AI assistant. Answer the question based on the provided context.

Context:
${context}

Question: ${query}

Answer:`;
  }

  getDocuments(): Document[] {
    return this.documentStore.listDocuments();
  }

  getDocument(id: string): Document | undefined {
    return this.documentStore.getDocument(id);
  }

  deleteDocument(id: string): boolean {
    const document = this.documentStore.getDocument(id);
    if (!document) return false;

    // Remove chunks from vector store
    if (document.chunks) {
      for (const chunk of document.chunks) {
        this.vectorStore.delete(chunk.id);
      }
    }

    return this.documentStore.deleteDocument(id);
  }

  clear(): void {
    this.documentStore.clear();
    this.vectorStore.clear();
  }

  getStats() {
    return {
      documents: this.documentStore.listDocuments().length,
      chunks: this.vectorStore.size(),
      embeddingDimension: this.embedder.getDimension(),
    };
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Statistics
class RAGStats {
  private queries = 0;
  private documents = 0;
  private totalTokens = 0;

  recordQuery(tokens: number): void {
    this.queries++;
    this.totalTokens += tokens;
  }

  recordIngestion(count: number): void {
    this.documents += count;
  }

  getStats() {
    return {
      queries: this.queries,
      documentsIngested: this.documents,
      totalTokens: this.totalTokens,
      averageTokensPerQuery: this.queries > 0 ? Math.round(this.totalTokens / this.queries) : 0,
    };
  }
}

// Server Implementation
const pipeline = new RAGPipeline();
const stats = new RAGStats();

/**
 * Native Elide beta11-rc1 HTTP Server - Fetch Handler Pattern
 *
 * Export a default fetch function that handles HTTP requests.
 * Run with: elide serve --port 8083 server.ts
 */
export default async function fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/health" || path === "/") {
        return new Response(
          JSON.stringify({
            status: "healthy",
            service: "RAG Service",
            uptime: process.uptime(),
            ...pipeline.getStats(),
            stats: stats.getStats(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Ingest documents
      if (path === "/v1/ingest" && req.method === "POST") {
        const body = await req.json() as IngestRequest;

        if (!body.documents || !Array.isArray(body.documents)) {
          return new Response(
            JSON.stringify({ error: "Documents array required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const result = await pipeline.ingestDocuments(body);
        stats.recordIngestion(result.processed);

        return new Response(
          JSON.stringify({
            success: true,
            processed: result.processed,
            chunks: result.chunks,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Query
      if (path === "/v1/query" && req.method === "POST") {
        const body = await req.json() as QueryRequest;

        if (!body.query) {
          return new Response(
            JSON.stringify({ error: "Query required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const result = await pipeline.query(body);
        stats.recordQuery(result.tokensUsed || 0);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // List documents
      if (path === "/v1/documents" && req.method === "GET") {
        const documents = pipeline.getDocuments();
        return new Response(
          JSON.stringify({
            documents: documents.map((d) => ({
              id: d.id,
              metadata: d.metadata,
              chunks: d.chunks?.length || 0,
              createdAt: d.createdAt,
            })),
            count: documents.length,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get document
      if (path.match(/^\/v1\/documents\/[^/]+$/) && req.method === "GET") {
        const documentId = path.split("/")[3];
        const document = pipeline.getDocument(documentId);

        if (!document) {
          return new Response(
            JSON.stringify({ error: "Document not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(document), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete document
      if (path.match(/^\/v1\/documents\/[^/]+$/) && req.method === "DELETE") {
        const documentId = path.split("/")[3];
        const success = pipeline.deleteDocument(documentId);

        if (!success) {
          return new Response(
            JSON.stringify({ error: "Document not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clear all
      if (path === "/v1/clear" && req.method === "POST") {
        pipeline.clear();
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Statistics
      if (path === "/v1/stats" && req.method === "GET") {
        return new Response(
          JSON.stringify({
            ...pipeline.getStats(),
            usage: stats.getStats(),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Not found
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : "Internal server error",
            type: "server_error",
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }
}

// Log server info on startup
if (import.meta.url.includes("server.ts")) {
  console.log("RAG Service running on http://localhost:8083");
  console.log("Endpoints:");
  console.log("  POST   /v1/ingest - Ingest documents");
  console.log("  POST   /v1/query - Query with RAG");
  console.log("  GET    /v1/documents - List documents");
  console.log("  GET    /v1/documents/{id} - Get document");
  console.log("  DELETE /v1/documents/{id} - Delete document");
  console.log("  POST   /v1/clear - Clear all data");
  console.log("  GET    /v1/stats - Service statistics");
  console.log("  GET    /health - Health check");
}
