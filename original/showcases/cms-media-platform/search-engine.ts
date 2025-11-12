/**
 * Search Engine
 *
 * Full-text search functionality for content:
 * - Inverted index for fast lookups
 * - Relevance scoring (TF-IDF inspired)
 * - Faceted search and filtering
 * - Fuzzy matching and suggestions
 * - Search analytics
 */

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
  includeHighlights?: boolean;
}

export interface SearchFilters {
  type?: string;
  author?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  tags: string[];
  score: number;
  highlights?: string[];
  publishedAt?: Date;
  updatedAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  took: number;
  facets: SearchFacets;
  suggestions?: string[];
}

export interface SearchFacets {
  types: Record<string, number>;
  authors: Record<string, number>;
  tags: Record<string, number>;
  dates: Record<string, number>;
}

export interface IndexedDocument {
  id: string;
  type: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  status: string;
  publishedAt?: Date;
  updatedAt: Date;
  tokens: string[];
  termFrequency: Map<string, number>;
}

export class SearchEngine {
  private documents: Map<string, IndexedDocument> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map(); // term -> document IDs
  private documentFrequency: Map<string, number> = new Map(); // term -> number of documents
  private searchHistory: Array<{ query: string; timestamp: Date; resultCount: number }> = [];
  private popularSearches: Map<string, number> = new Map();

  constructor() {
    console.log('🔍 Search Engine initialized');
  }

  /**
   * Index content for searching
   */
  indexContent(content: any): void {
    const tokens = this.tokenize(content.title + ' ' + content.content);
    const termFrequency = this.calculateTermFrequency(tokens);

    const doc: IndexedDocument = {
      id: content.id,
      type: content.type,
      title: content.title,
      content: content.content,
      author: content.author || content.authorName,
      tags: content.tags || [],
      status: content.status,
      publishedAt: content.publishedAt,
      updatedAt: content.updatedAt,
      tokens,
      termFrequency
    };

    // Remove old document from index if exists
    if (this.documents.has(content.id)) {
      this.removeFromIndex(content.id);
    }

    // Add to documents
    this.documents.set(content.id, doc);

    // Update inverted index
    for (const token of new Set(tokens)) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(content.id);

      // Update document frequency
      this.documentFrequency.set(token, (this.documentFrequency.get(token) || 0) + 1);
    }
  }

  /**
   * Remove content from index
   */
  removeContent(id: string): void {
    this.removeFromIndex(id);
    this.documents.delete(id);
  }

  /**
   * Remove document from inverted index
   */
  private removeFromIndex(id: string): void {
    const doc = this.documents.get(id);
    if (!doc) return;

    for (const token of new Set(doc.tokens)) {
      const docIds = this.invertedIndex.get(token);
      if (docIds) {
        docIds.delete(id);
        if (docIds.size === 0) {
          this.invertedIndex.delete(token);
          this.documentFrequency.delete(token);
        } else {
          this.documentFrequency.set(token, docIds.size);
        }
      }
    }
  }

  /**
   * Search content
   */
  search(query: string, filters: SearchFilters = {}): SearchResponse {
    const startTime = Date.now();

    // Track search
    this.trackSearch(query);

    // Tokenize query
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) {
      return this.emptyResponse(startTime);
    }

    // Get candidate documents (documents containing at least one query term)
    const candidates = this.getCandidates(queryTokens);

    // Calculate relevance scores
    const scored = this.scoreDocuments(candidates, queryTokens);

    // Apply filters
    const filtered = this.applyFilters(scored, filters);

    // Sort by score (relevance)
    filtered.sort((a, b) => b.score - a.score);

    // Calculate facets
    const facets = this.calculateFacets(filtered);

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const start = (page - 1) * limit;
    const paginatedResults = filtered.slice(start, start + limit);

    // Generate highlights
    const results = paginatedResults.map(result => ({
      ...result,
      highlights: this.generateHighlights(result.content, queryTokens)
    }));

    // Generate suggestions for misspellings
    const suggestions = this.generateSuggestions(query, queryTokens);

    const took = Date.now() - startTime;

    // Update search history
    this.searchHistory.push({
      query,
      timestamp: new Date(),
      resultCount: filtered.length
    });

    return {
      results,
      total: filtered.length,
      page,
      limit,
      took,
      facets,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Get candidate documents
   */
  private getCandidates(queryTokens: string[]): Set<string> {
    const candidates = new Set<string>();

    for (const token of queryTokens) {
      const docIds = this.invertedIndex.get(token);
      if (docIds) {
        docIds.forEach(id => candidates.add(id));
      }

      // Fuzzy matching - find similar terms
      const similarTerms = this.findSimilarTerms(token);
      for (const similarTerm of similarTerms) {
        const similarDocIds = this.invertedIndex.get(similarTerm);
        if (similarDocIds) {
          similarDocIds.forEach(id => candidates.add(id));
        }
      }
    }

    return candidates;
  }

  /**
   * Score documents using TF-IDF inspired algorithm
   */
  private scoreDocuments(candidateIds: Set<string>, queryTokens: string[]): SearchResult[] {
    const results: SearchResult[] = [];
    const totalDocs = this.documents.size;

    for (const id of candidateIds) {
      const doc = this.documents.get(id);
      if (!doc) continue;

      let score = 0;

      // Calculate TF-IDF score for each query term
      for (const token of queryTokens) {
        const tf = doc.termFrequency.get(token) || 0;
        const df = this.documentFrequency.get(token) || 1;
        const idf = Math.log((totalDocs + 1) / df);

        score += tf * idf;
      }

      // Boost for title matches
      const titleTokens = this.tokenize(doc.title);
      const titleMatches = queryTokens.filter(token => titleTokens.includes(token)).length;
      score += titleMatches * 5;

      // Boost for tag matches
      const tagMatches = queryTokens.filter(token =>
        doc.tags.some(tag => this.tokenize(tag).includes(token))
      ).length;
      score += tagMatches * 3;

      // Boost for exact phrase matches
      const queryPhrase = queryTokens.join(' ');
      if (doc.content.toLowerCase().includes(queryPhrase)) {
        score += 10;
      }

      // Recency boost (newer content gets slight boost)
      const ageInDays = (Date.now() - doc.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 1 - ageInDays / 365);
      score += recencyBoost;

      results.push({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        content: doc.content,
        excerpt: this.generateExcerpt(doc.content, queryTokens),
        author: doc.author,
        tags: doc.tags,
        score: Math.round(score * 100) / 100,
        publishedAt: doc.publishedAt,
        updatedAt: doc.updatedAt
      });
    }

    return results;
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    let filtered = results;

    if (filters.type) {
      filtered = filtered.filter(r => r.type === filters.type);
    }

    if (filters.author) {
      filtered = filtered.filter(r => r.author === filters.author);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(r =>
        filters.tags!.some(tag => r.tags.includes(tag))
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(r =>
        r.updatedAt >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(r =>
        r.updatedAt <= filters.dateTo!
      );
    }

    if (filters.status) {
      const doc = this.documents.get(filtered[0]?.id);
      filtered = filtered.filter(r => {
        const d = this.documents.get(r.id);
        return d?.status === filters.status;
      });
    }

    return filtered;
  }

  /**
   * Calculate search facets
   */
  private calculateFacets(results: SearchResult[]): SearchFacets {
    const facets: SearchFacets = {
      types: {},
      authors: {},
      tags: {},
      dates: {}
    };

    for (const result of results) {
      // Type facets
      facets.types[result.type] = (facets.types[result.type] || 0) + 1;

      // Author facets
      facets.authors[result.author] = (facets.authors[result.author] || 0) + 1;

      // Tag facets
      for (const tag of result.tags) {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      }

      // Date facets (by month)
      if (result.updatedAt) {
        const monthKey = `${result.updatedAt.getFullYear()}-${String(result.updatedAt.getMonth() + 1).padStart(2, '0')}`;
        facets.dates[monthKey] = (facets.dates[monthKey] || 0) + 1;
      }
    }

    return facets;
  }

  /**
   * Generate excerpt with context around query terms
   */
  private generateExcerpt(content: string, queryTokens: string[], maxLength = 200): string {
    const lowerContent = content.toLowerCase();

    // Find first occurrence of any query term
    let firstIndex = -1;
    for (const token of queryTokens) {
      const index = lowerContent.indexOf(token);
      if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
        firstIndex = index;
      }
    }

    if (firstIndex === -1) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    // Get context around the match
    const start = Math.max(0, firstIndex - 50);
    const end = Math.min(content.length, firstIndex + maxLength);
    let excerpt = content.substring(start, end);

    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  /**
   * Generate highlights for matched terms
   */
  private generateHighlights(content: string, queryTokens: string[]): string[] {
    const highlights: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const token of queryTokens) {
      let index = 0;
      while ((index = lowerContent.indexOf(token, index)) !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(content.length, index + token.length + 30);
        let highlight = content.substring(start, end);

        if (start > 0) highlight = '...' + highlight;
        if (end < content.length) highlight = highlight + '...';

        highlights.push(highlight);

        if (highlights.length >= 3) break; // Max 3 highlights per term
        index += token.length;
      }
    }

    return highlights.slice(0, 5); // Max 5 total highlights
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(originalQuery: string, queryTokens: string[]): string[] {
    const suggestions: string[] = [];

    // Check for common misspellings and suggest corrections
    for (const token of queryTokens) {
      if (!this.invertedIndex.has(token)) {
        const similar = this.findSimilarTerms(token, 3);
        if (similar.length > 0) {
          const suggestion = originalQuery.replace(token, similar[0]);
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  /**
   * Find similar terms using edit distance
   */
  private findSimilarTerms(term: string, maxResults = 5): string[] {
    const similar: Array<{ term: string; distance: number }> = [];

    for (const indexedTerm of this.invertedIndex.keys()) {
      // Quick length filter
      if (Math.abs(indexedTerm.length - term.length) > 2) continue;

      const distance = this.levenshteinDistance(term, indexedTerm);
      if (distance <= 2) {
        similar.push({ term: indexedTerm, distance });
      }
    }

    return similar
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults)
      .map(s => s.term);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Tokenize text into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2) // Ignore very short tokens
      .filter(token => !this.isStopWord(token));
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those'
    ]);

    return stopWords.has(word);
  }

  /**
   * Calculate term frequency
   */
  private calculateTermFrequency(tokens: string[]): Map<string, number> {
    const frequency = new Map<string, number>();

    for (const token of tokens) {
      frequency.set(token, (frequency.get(token) || 0) + 1);
    }

    // Normalize by document length
    const maxFreq = Math.max(...frequency.values());
    for (const [term, freq] of frequency) {
      frequency.set(term, freq / maxFreq);
    }

    return frequency;
  }

  /**
   * Track search query
   */
  private trackSearch(query: string): void {
    const lowerQuery = query.toLowerCase();
    this.popularSearches.set(lowerQuery, (this.popularSearches.get(lowerQuery) || 0) + 1);
  }

  /**
   * Get popular searches
   */
  getPopularSearches(limit = 10): Array<{ query: string; count: number }> {
    return Array.from(this.popularSearches.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search analytics
   */
  getStats(): any {
    const recentSearches = this.searchHistory.slice(-100);
    const avgResults =
      recentSearches.length > 0
        ? recentSearches.reduce((sum, s) => sum + s.resultCount, 0) / recentSearches.length
        : 0;

    return {
      totalDocuments: this.documents.size,
      totalTerms: this.invertedIndex.size,
      totalSearches: this.searchHistory.length,
      avgResultsPerSearch: Math.round(avgResults),
      popularSearches: this.getPopularSearches(5),
      recentSearches: this.searchHistory.slice(-10).reverse()
    };
  }

  /**
   * Empty search response
   */
  private emptyResponse(startTime: number): SearchResponse {
    return {
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      took: Date.now() - startTime,
      facets: {
        types: {},
        authors: {},
        tags: {},
        dates: {}
      }
    };
  }

  /**
   * Rebuild entire index (for maintenance)
   */
  rebuildIndex(): void {
    this.invertedIndex.clear();
    this.documentFrequency.clear();

    for (const doc of this.documents.values()) {
      for (const token of new Set(doc.tokens)) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token)!.add(doc.id);
        this.documentFrequency.set(token, (this.documentFrequency.get(token) || 0) + 1);
      }
    }
  }
}
