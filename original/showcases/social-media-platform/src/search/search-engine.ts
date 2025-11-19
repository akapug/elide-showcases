/**
 * Search Engine - Full-Text and Semantic Search
 *
 * Implements advanced search using:
 * - python:transformers for semantic search (BERT embeddings)
 * - python:sklearn for similarity calculations
 * - python:numpy for vector operations
 *
 * Provides hybrid search combining text matching and semantic understanding.
 */

// @ts-ignore
import transformers from 'python:transformers';
// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  SearchQuery,
  SearchResults,
  SearchResult,
  SearchFilters,
  SearchSort,
  Post,
  User,
  Hashtag,
} from '../types';

/**
 * Search engine configuration
 */
export interface SearchEngineConfig {
  // Search types
  enableTextSearch: boolean;
  enableSemanticSearch: boolean;
  enableHybridSearch: boolean;
  defaultSearchType: 'text' | 'semantic' | 'hybrid';

  // Models
  embeddingModel: string;
  rerankingModel?: string;

  // Text search
  bm25K1: number;
  bm25B: number;

  // Semantic search
  similarityThreshold: number;
  topK: number;

  // Hybrid weights
  textWeight: number;
  semanticWeight: number;

  // Features
  enableAutocomplete: boolean;
  enableSpellCorrection: boolean;
  enableQueryExpansion: boolean;
  enableFacets: boolean;

  // Performance
  maxResults: number;
  resultsPerPage: number;
  enableCaching: boolean;
  cacheTTL: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SearchEngineConfig = {
  enableTextSearch: true,
  enableSemanticSearch: true,
  enableHybridSearch: true,
  defaultSearchType: 'hybrid',
  embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
  bm25K1: 1.5,
  bm25B: 0.75,
  similarityThreshold: 0.3,
  topK: 100,
  textWeight: 0.4,
  semanticWeight: 0.6,
  enableAutocomplete: true,
  enableSpellCorrection: true,
  enableQueryExpansion: false,
  enableFacets: true,
  maxResults: 1000,
  resultsPerPage: 20,
  enableCaching: true,
  cacheTTL: 300,
};

/**
 * SearchEngine - Main search class
 */
export class SearchEngine {
  private config: SearchEngineConfig;
  private embeddingModel: any;
  private embeddingTokenizer: any;
  private queryEmbeddingCache: Map<string, number[]>;
  private searchCache: Map<string, SearchResults>;
  private documentIndex: Map<string, Post | User | Hashtag>;
  private documentEmbeddings: Map<string, number[]>;
  private invertedIndex: Map<string, Set<string>>;
  private idfScores: Map<string, number>;

  constructor(config: Partial<SearchEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queryEmbeddingCache = new Map();
    this.searchCache = new Map();
    this.documentIndex = new Map();
    this.documentEmbeddings = new Map();
    this.invertedIndex = new Map();
    this.idfScores = new Map();
  }

  /**
   * Initialize search engine
   */
  async initialize(): Promise<void> {
    console.log('Initializing SearchEngine...');

    // Load embedding model
    if (this.config.enableSemanticSearch || this.config.enableHybridSearch) {
      this.embeddingTokenizer = transformers.AutoTokenizer.from_pretrained(
        this.config.embeddingModel
      );
      this.embeddingModel = transformers.AutoModel.from_pretrained(
        this.config.embeddingModel
      );
    }

    console.log('SearchEngine initialized successfully');
  }

  /**
   * Search with query
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const startTime = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(query);
    if (this.config.enableCaching && this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Determine search type
    const searchType = query.type === 'all'
      ? this.config.defaultSearchType
      : this.config.defaultSearchType;

    // Execute search
    let results: SearchResult[];

    switch (searchType) {
      case 'text':
        results = await this.textSearch(query);
        break;
      case 'semantic':
        results = await this.semanticSearch(query);
        break;
      case 'hybrid':
        results = await this.hybridSearch(query);
        break;
      default:
        results = await this.hybridSearch(query);
    }

    // Apply filters
    if (query.filters) {
      results = this.applyFilters(results, query.filters);
    }

    // Apply sorting
    if (query.sort) {
      results = this.applySort(results, query.sort);
    }

    // Generate suggestions
    const suggestions = this.config.enableAutocomplete
      ? await this.generateSuggestions(query.query)
      : [];

    const processingTime = performance.now() - startTime;

    // Paginate
    const offset = query.offset || 0;
    const limit = query.limit || this.config.resultsPerPage;
    const paginatedResults = results.slice(offset, offset + limit);

    const searchResults: SearchResults = {
      results: paginatedResults,
      totalCount: results.length,
      query: query.query,
      processingTime,
      searchType,
      suggestions,
    };

    // Cache results
    if (this.config.enableCaching) {
      this.searchCache.set(cacheKey, searchResults);
    }

    return searchResults;
  }

  /**
   * Text-based search using BM25
   */
  async textSearch(query: SearchQuery): Promise<SearchResult[]> {
    const queryTerms = this.tokenize(query.query.toLowerCase());

    // Calculate BM25 scores for all documents
    const scores = new Map<string, number>();

    for (const [docId, doc] of this.documentIndex) {
      const score = this.calculateBM25(queryTerms, docId, doc);
      if (score > 0) {
        scores.set(docId, score);
      }
    }

    // Convert to search results
    const results: SearchResult[] = [];
    for (const [docId, score] of scores) {
      const doc = this.documentIndex.get(docId)!;
      results.push({
        id: docId,
        type: this.getDocumentType(doc),
        score,
        highlight: this.generateHighlights(doc, queryTerms),
        data: doc,
      });
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, this.config.topK);
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateQueryEmbedding(query.query);

    // Calculate similarities with all documents
    const similarities: Array<{ docId: string; similarity: number }> = [];

    for (const [docId, docEmbedding] of this.documentEmbeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);

      if (similarity >= this.config.similarityThreshold) {
        similarities.push({ docId, similarity });
      }
    }

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Convert to search results
    const results: SearchResult[] = [];
    for (const { docId, similarity } of similarities.slice(0, this.config.topK)) {
      const doc = this.documentIndex.get(docId);
      if (doc) {
        results.push({
          id: docId,
          type: this.getDocumentType(doc),
          score: similarity,
          data: doc,
        });
      }
    }

    return results;
  }

  /**
   * Hybrid search combining text and semantic
   */
  async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    // Run both searches in parallel
    const [textResults, semanticResults] = await Promise.all([
      this.textSearch(query),
      this.semanticSearch(query),
    ]);

    // Combine using reciprocal rank fusion
    const combined = this.reciprocalRankFusion([textResults, semanticResults], {
      textWeight: this.config.textWeight,
      semanticWeight: this.config.semanticWeight,
    });

    return combined;
  }

  /**
   * Reciprocal rank fusion for combining results
   */
  reciprocalRankFusion(
    resultSets: SearchResult[][],
    weights: { textWeight: number; semanticWeight: number }
  ): SearchResult[] {
    const k = 60; // RRF constant
    const scoreMap = new Map<string, { score: number; result: SearchResult }>();
    const weightArray = [weights.textWeight, weights.semanticWeight];

    for (let i = 0; i < resultSets.length; i++) {
      const results = resultSets[i];
      const weight = weightArray[i];

      for (let rank = 0; rank < results.length; rank++) {
        const result = results[rank];
        const rrfScore = weight / (k + rank + 1);

        const existing = scoreMap.get(result.id);
        if (existing) {
          existing.score += rrfScore;
        } else {
          scoreMap.set(result.id, {
            score: rrfScore,
            result: { ...result, score: rrfScore },
          });
        }
      }
    }

    // Convert to array and sort
    const combined = Array.from(scoreMap.values())
      .map(item => item.result)
      .sort((a, b) => b.score - a.score);

    return combined;
  }

  /**
   * Calculate BM25 score
   */
  calculateBM25(queryTerms: string[], docId: string, doc: any): number {
    const avgDocLength = this.calculateAvgDocLength();
    const docLength = this.getDocLength(doc);
    const N = this.documentIndex.size;

    let score = 0;

    for (const term of queryTerms) {
      const tf = this.getTermFrequency(term, doc);
      const df = this.getDocumentFrequency(term);

      if (df === 0) continue;

      const idf = Math.log((N - df + 0.5) / (df + 0.5));
      const numerator = tf * (this.config.bm25K1 + 1);
      const denominator = tf + this.config.bm25K1 * (
        1 - this.config.bm25B + this.config.bm25B * (docLength / avgDocLength)
      );

      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * Generate query embedding
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    // Check cache
    if (this.queryEmbeddingCache.has(query)) {
      return this.queryEmbeddingCache.get(query)!;
    }

    // Tokenize
    const inputs = this.embeddingTokenizer(
      query,
      { padding: true, truncation: true, return_tensors: 'pt' }
    );

    // Generate embedding
    const outputs = this.embeddingModel(**inputs);
    const embeddings = outputs.last_hidden_state;

    // Mean pooling
    const attentionMask = inputs.attention_mask;
    const maskedEmbeddings = embeddings * attentionMask.unsqueeze(-1);
    const sumEmbeddings = maskedEmbeddings.sum(dim=1);
    const sumMask = attentionMask.sum(dim=1, keepdim=True);
    const meanPooled = sumEmbeddings / sumMask;

    // Convert to array
    const embedding = Array.from(meanPooled[0].detach().numpy());

    // Cache
    this.queryEmbeddingCache.set(query, embedding);

    return embedding;
  }

  /**
   * Calculate cosine similarity
   */
  cosineSimilarity(a: number[], b: number[]): number {
    const npA = numpy.array(a);
    const npB = numpy.array(b);

    const dotProduct = numpy.dot(npA, npB);
    const normA = numpy.linalg.norm(npA);
    const normB = numpy.linalg.norm(npB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Autocomplete suggestions
   */
  async autocomplete(prefix: string, limit: number = 10): Promise<string[]> {
    const lowerPrefix = prefix.toLowerCase();
    const suggestions: string[] = [];

    // Get matching terms from index
    for (const term of this.invertedIndex.keys()) {
      if (term.startsWith(lowerPrefix)) {
        suggestions.push(term);
      }
    }

    // Sort by frequency (using IDF as proxy)
    suggestions.sort((a, b) => {
      const freqA = this.getDocumentFrequency(a);
      const freqB = this.getDocumentFrequency(b);
      return freqB - freqA;
    });

    return suggestions.slice(0, limit);
  }

  /**
   * Generate query suggestions
   */
  async generateSuggestions(query: string): Promise<string[]> {
    // Simple approach: use autocomplete on query terms
    const terms = this.tokenize(query.toLowerCase());
    if (terms.length === 0) return [];

    const lastTerm = terms[terms.length - 1];
    const suggestions = await this.autocomplete(lastTerm, 5);

    return suggestions.map(suggestion => {
      const newTerms = [...terms.slice(0, -1), suggestion];
      return newTerms.join(' ');
    });
  }

  /**
   * Index a document
   */
  async indexDocument(id: string, document: Post | User | Hashtag): Promise<void> {
    // Store document
    this.documentIndex.set(id, document);

    // Generate and store embedding
    const text = this.extractText(document);
    const embedding = await this.generateQueryEmbedding(text);
    this.documentEmbeddings.set(id, embedding);

    // Update inverted index
    const terms = this.tokenize(text.toLowerCase());
    for (const term of terms) {
      if (!this.invertedIndex.has(term)) {
        this.invertedIndex.set(term, new Set());
      }
      this.invertedIndex.get(term)!.add(id);
    }

    // Update IDF scores
    this.updateIDF();
  }

  /**
   * Remove document from index
   */
  removeDocument(id: string): void {
    const doc = this.documentIndex.get(id);
    if (!doc) return;

    // Remove from document index
    this.documentIndex.delete(id);
    this.documentEmbeddings.delete(id);

    // Remove from inverted index
    const text = this.extractText(doc);
    const terms = this.tokenize(text.toLowerCase());
    for (const term of terms) {
      const postings = this.invertedIndex.get(term);
      if (postings) {
        postings.delete(id);
        if (postings.size === 0) {
          this.invertedIndex.delete(term);
        }
      }
    }

    // Update IDF scores
    this.updateIDF();
  }

  /**
   * Update IDF scores
   */
  updateIDF(): void {
    const N = this.documentIndex.size;
    for (const [term, postings] of this.invertedIndex) {
      const df = postings.size;
      const idf = Math.log((N - df + 0.5) / (df + 0.5));
      this.idfScores.set(term, idf);
    }
  }

  /**
   * Helper methods
   */

  tokenize(text: string): string[] {
    // Simple tokenization - would use more sophisticated tokenizer in production
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  extractText(doc: Post | User | Hashtag): string {
    if ('content' in doc) {
      // Post
      return doc.content;
    } else if ('displayName' in doc) {
      // User
      return `${doc.displayName} ${doc.bio || ''}`;
    } else if ('tag' in doc) {
      // Hashtag
      return doc.tag;
    }
    return '';
  }

  getDocumentType(doc: any): 'post' | 'user' | 'hashtag' {
    if ('content' in doc) return 'post';
    if ('displayName' in doc) return 'user';
    if ('tag' in doc) return 'hashtag';
    return 'post';
  }

  getDocLength(doc: any): number {
    const text = this.extractText(doc);
    return this.tokenize(text).length;
  }

  calculateAvgDocLength(): number {
    let total = 0;
    for (const doc of this.documentIndex.values()) {
      total += this.getDocLength(doc);
    }
    return total / this.documentIndex.size || 1;
  }

  getTermFrequency(term: string, doc: any): number {
    const text = this.extractText(doc);
    const terms = this.tokenize(text.toLowerCase());
    return terms.filter(t => t === term).length;
  }

  getDocumentFrequency(term: string): number {
    const postings = this.invertedIndex.get(term);
    return postings ? postings.size : 0;
  }

  generateHighlights(doc: any, queryTerms: string[]): Record<string, string[]> {
    const text = this.extractText(doc);
    const highlights: string[] = [];

    const lowerText = text.toLowerCase();
    for (const term of queryTerms) {
      const index = lowerText.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + term.length + 50);
        highlights.push(`...${text.substring(start, end)}...`);
      }
    }

    return { content: highlights };
  }

  applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => {
      const doc = result.data;

      // Date range filter
      if (filters.dateRange && 'createdAt' in doc) {
        const createdAt = (doc as Post).createdAt;
        if (filters.dateRange.start && createdAt < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && createdAt > filters.dateRange.end) {
          return false;
        }
      }

      // Media filter
      if (filters.hasMedia !== undefined && 'media' in doc) {
        const hasMedia = (doc as Post).media.length > 0;
        if (filters.hasMedia !== hasMedia) {
          return false;
        }
      }

      // Verified filter
      if (filters.verified !== undefined && 'verified' in doc) {
        if (filters.verified !== (doc as User).verified) {
          return false;
        }
      }

      return true;
    });
  }

  applySort(results: SearchResult[], sort: SearchSort): SearchResult[] {
    const sorted = [...results];

    sorted.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sort.field) {
        case 'relevance':
          valueA = a.score;
          valueB = b.score;
          break;
        case 'date':
          valueA = 'createdAt' in a.data ? (a.data as Post).createdAt.getTime() : 0;
          valueB = 'createdAt' in b.data ? (b.data as Post).createdAt.getTime() : 0;
          break;
        case 'engagement':
          valueA = 'engagement' in a.data ? (a.data as Post).engagement.likes : 0;
          valueB = 'engagement' in b.data ? (b.data as Post).engagement.likes : 0;
          break;
        case 'followers':
          valueA = 'followers' in a.data ? (a.data as User).followers : 0;
          valueB = 'followers' in b.data ? (b.data as User).followers : 0;
          break;
        default:
          valueA = a.score;
          valueB = b.score;
      }

      return sort.order === 'asc' ? valueA - valueB : valueB - valueA;
    });

    return sorted;
  }

  getCacheKey(query: SearchQuery): string {
    return JSON.stringify(query);
  }

  clearCache(): void {
    this.searchCache.clear();
    this.queryEmbeddingCache.clear();
  }

  getStats(): any {
    return {
      documentsIndexed: this.documentIndex.size,
      embeddingsCached: this.documentEmbeddings.size,
      termsIndexed: this.invertedIndex.size,
      searchCacheSize: this.searchCache.size,
      queryCacheSize: this.queryEmbeddingCache.size,
      config: this.config,
    };
  }
}

/**
 * Create a default SearchEngine instance
 */
export function createSearchEngine(config?: Partial<SearchEngineConfig>): SearchEngine {
  return new SearchEngine(config);
}
