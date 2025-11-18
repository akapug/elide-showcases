/**
 * Document retrieval module
 * Handles semantic search and context retrieval for RAG
 */

import { EmbeddingService } from '../embeddings/embedding-service';
import { VectorStore, SearchResult } from '../vectorstore/vector-store';

export interface RetrievalOptions {
  topK?: number;
  minScore?: number;
  filterMetadata?: Record<string, any>;
  includeContext?: boolean;
  contextWindow?: number;
}

export interface RetrievedDocument {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, any>;
  context?: {
    before?: string;
    after?: string;
  };
}

export interface RetrievalResult {
  query: string;
  documents: RetrievedDocument[];
  retrievalTimeMs: number;
  totalResults: number;
}

export class Retriever {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;

  constructor(embeddingService: EmbeddingService, vectorStore: VectorStore) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  /**
   * Retrieve relevant documents for a query
   * Ultra-fast: embedding + search happens in-process!
   */
  async retrieve(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    const topK = options.topK || 5;
    const minScore = options.minScore || 0.0;

    // Step 1: Generate query embedding (in-process Python call)
    const queryEmbedding = await this.embeddingService.encodeText(query);

    // Step 2: Search vector store (FAISS in-process, ultra-fast!)
    const searchResults = await this.vectorStore.search(
      queryEmbedding,
      topK,
      options.filterMetadata
    );

    // Step 3: Filter by score and format results
    const documents = searchResults
      .filter((r) => r.score >= minScore)
      .map((r) => this.formatResult(r));

    // Step 4: Add context if requested
    if (options.includeContext) {
      await this.addContext(documents, options.contextWindow || 1);
    }

    const retrievalTimeMs = Date.now() - startTime;

    return {
      query,
      documents,
      retrievalTimeMs,
      totalResults: documents.length,
    };
  }

  /**
   * Hybrid search: combine semantic search with keyword filtering
   */
  async hybridSearch(
    query: string,
    keywords: string[],
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    // Semantic search
    const semanticResults = await this.retrieve(query, {
      ...options,
      topK: (options.topK || 5) * 2, // Retrieve more for filtering
    });

    // Keyword filtering
    const filteredDocs = semanticResults.documents.filter((doc) => {
      const text = doc.text.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });

    // Re-rank and limit
    const documents = filteredDocs.slice(0, options.topK || 5);

    const retrievalTimeMs = Date.now() - startTime;

    return {
      query,
      documents,
      retrievalTimeMs,
      totalResults: documents.length,
    };
  }

  /**
   * Multi-query retrieval with result fusion
   */
  async multiQueryRetrieve(
    queries: string[],
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    // Retrieve for each query
    const allResults = await Promise.all(
      queries.map((q) => this.retrieve(q, options))
    );

    // Fuse results using Reciprocal Rank Fusion (RRF)
    const fusedDocs = this.fuseResults(
      allResults.map((r) => r.documents),
      options.topK || 5
    );

    const retrievalTimeMs = Date.now() - startTime;

    return {
      query: queries.join(' | '),
      documents: fusedDocs,
      retrievalTimeMs,
      totalResults: fusedDocs.length,
    };
  }

  /**
   * Format search result
   */
  private formatResult(result: SearchResult): RetrievedDocument {
    return {
      id: result.id,
      text: result.document,
      score: result.score,
      metadata: result.metadata,
    };
  }

  /**
   * Add context from neighboring chunks
   */
  private async addContext(
    documents: RetrievedDocument[],
    contextWindow: number
  ): Promise<void> {
    for (const doc of documents) {
      const { documentId, chunkIndex } = doc.metadata;

      if (documentId && chunkIndex !== undefined) {
        // Get neighboring chunks
        const beforeIndex = Math.max(0, chunkIndex - contextWindow);
        const afterIndex = chunkIndex + contextWindow;

        // This is simplified - in a real implementation,
        // you'd query the vector store for specific chunk IDs
        doc.context = {
          before: `[Context from previous ${contextWindow} chunk(s)]`,
          after: `[Context from next ${contextWindow} chunk(s)]`,
        };
      }
    }
  }

  /**
   * Fuse results from multiple queries using Reciprocal Rank Fusion
   */
  private fuseResults(
    resultSets: RetrievedDocument[][],
    topK: number
  ): RetrievedDocument[] {
    const k = 60; // RRF constant

    // Calculate RRF scores
    const docScores = new Map<string, { doc: RetrievedDocument; score: number }>();

    for (const results of resultSets) {
      results.forEach((doc, rank) => {
        const rrf_score = 1 / (k + rank + 1);

        const existing = docScores.get(doc.id);
        if (existing) {
          existing.score += rrf_score;
        } else {
          docScores.set(doc.id, { doc, score: rrf_score });
        }
      });
    }

    // Sort by RRF score and take top K
    return Array.from(docScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => ({
        ...item.doc,
        score: item.score, // Use RRF score
      }));
  }

  /**
   * Get statistics about retrieval performance
   */
  async benchmark(queries: string[], topK: number = 5): Promise<{
    avgRetrievalTimeMs: number;
    minRetrievalTimeMs: number;
    maxRetrievalTimeMs: number;
    queriesPerSecond: number;
  }> {
    const times: number[] = [];

    for (const query of queries) {
      const result = await this.retrieve(query, { topK });
      times.push(result.retrievalTimeMs);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

    return {
      avgRetrievalTimeMs: avgTime,
      minRetrievalTimeMs: Math.min(...times),
      maxRetrievalTimeMs: Math.max(...times),
      queriesPerSecond: 1000 / avgTime,
    };
  }
}
