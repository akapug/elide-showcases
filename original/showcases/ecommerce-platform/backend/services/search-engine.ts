/**
 * Advanced Search Engine
 *
 * Production-ready search functionality with:
 * - Full-text search
 * - Fuzzy matching
 * - Faceted search
 * - Advanced filters
 * - Sort options
 * - Search suggestions
 * - Autocomplete
 * - Search analytics
 * - Relevance scoring
 * - Spelling correction
 * - Search history
 * - Popular searches
 */

import { Database, Product } from '../db/database.ts';
import { Decimal } from '../../shared/decimal.ts';

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface SearchFilters {
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  brands?: string[];
  tags?: string[];
}

export interface SortOption {
  field: 'relevance' | 'price' | 'name' | 'newest' | 'popularity' | 'rating';
  order: 'asc' | 'desc';
}

export interface SearchResult {
  product: Product;
  score: number;
  highlights: {
    name?: string;
    description?: string;
  };
  matchedTerms: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pages: number;
  facets: SearchFacets;
  suggestions?: string[];
  didYouMean?: string;
  searchTime: number;
}

export interface SearchFacets {
  categories: Array<{ value: string; count: number }>;
  priceRanges: Array<{ range: string; min: number; max: number; count: number }>;
  availability: { inStock: number; outOfStock: number };
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'product' | 'category';
  score: number;
}

export interface PopularSearch {
  query: string;
  count: number;
  lastSearched: Date;
}

/**
 * Advanced Search Engine with full-text search and filtering
 */
export class SearchEngine {
  private db: Database;
  private searchHistory: Map<string, PopularSearch> = new Map();
  private userSearchHistory: Map<string, string[]> = new Map(); // sessionId -> queries
  private productIndex: Map<string, Set<string>> = new Map(); // term -> product IDs

  // Common words to ignore in search
  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with',
  ]);

  constructor(db: Database) {
    this.db = db;
    this.buildSearchIndex();
  }

  // ============================================================================
  // Index Building
  // ============================================================================

  /**
   * Build inverted index for fast searching
   */
  private buildSearchIndex() {
    const products = this.db.getProducts();

    for (const product of products) {
      // Index product name and description
      const text = `${product.name} ${product.description} ${product.category}`;
      const terms = this.tokenize(text);

      for (const term of terms) {
        if (!this.productIndex.has(term)) {
          this.productIndex.set(term, new Set());
        }
        this.productIndex.get(term)!.add(product.id);
      }
    }
  }

  /**
   * Tokenize text into searchable terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2 && !this.stopWords.has(term));
  }

  /**
   * Rebuild index (call after product updates)
   */
  rebuildIndex() {
    this.productIndex.clear();
    this.buildSearchIndex();
  }

  // ============================================================================
  // Search
  // ============================================================================

  /**
   * Perform full-text search
   */
  search(searchQuery: SearchQuery): SearchResponse {
    const startTime = Date.now();

    // Track search
    this.trackSearch(searchQuery.query);

    // Parse and normalize query
    const queryTerms = this.tokenize(searchQuery.query);

    if (queryTerms.length === 0) {
      return this.getEmptySearchResponse(startTime);
    }

    // Find matching products
    const matchingProducts = this.findMatchingProducts(queryTerms);

    // Calculate relevance scores
    const scoredResults = this.scoreResults(matchingProducts, queryTerms, searchQuery.query);

    // Apply filters
    let filteredResults = this.applyFilters(scoredResults, searchQuery.filters);

    // Sort results
    filteredResults = this.sortResults(filteredResults, searchQuery.sort);

    // Pagination
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedResults = filteredResults.slice(start, end);

    // Calculate facets
    const facets = this.calculateFacets(filteredResults);

    // Generate suggestions
    const suggestions = this.generateSuggestions(searchQuery.query, queryTerms);

    // Check for spelling correction
    const didYouMean = this.checkSpelling(searchQuery.query);

    const searchTime = Date.now() - startTime;

    return {
      results: paginatedResults,
      total: filteredResults.length,
      page,
      pages: Math.ceil(filteredResults.length / limit),
      facets,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      didYouMean: didYouMean !== searchQuery.query ? didYouMean : undefined,
      searchTime,
    };
  }

  /**
   * Find products matching search terms
   */
  private findMatchingProducts(terms: string[]): Map<string, number> {
    const matches = new Map<string, number>();

    for (const term of terms) {
      // Exact matches
      const exactMatches = this.productIndex.get(term);
      if (exactMatches) {
        for (const productId of exactMatches) {
          matches.set(productId, (matches.get(productId) || 0) + 1);
        }
      }

      // Fuzzy matches (prefix matching)
      for (const [indexedTerm, productIds] of this.productIndex.entries()) {
        if (indexedTerm.startsWith(term) && indexedTerm !== term) {
          for (const productId of productIds) {
            matches.set(productId, (matches.get(productId) || 0) + 0.5);
          }
        }
      }
    }

    return matches;
  }

  /**
   * Score and rank search results
   */
  private scoreResults(
    matches: Map<string, number>,
    queryTerms: string[],
    originalQuery: string
  ): SearchResult[] {
    const results: SearchResult[] = [];

    for (const [productId, termMatches] of matches.entries()) {
      const product = this.db.getProduct(productId);
      if (!product) continue;

      // Base score from term matches
      let score = termMatches;

      // Boost for exact phrase match
      const productText = `${product.name} ${product.description}`.toLowerCase();
      if (productText.includes(originalQuery.toLowerCase())) {
        score *= 2;
      }

      // Boost for matches in product name
      const nameLower = product.name.toLowerCase();
      let nameMatches = 0;
      for (const term of queryTerms) {
        if (nameLower.includes(term)) {
          nameMatches++;
          score += 5;
        }
      }

      // Boost for category match
      if (queryTerms.includes(product.category.toLowerCase())) {
        score += 3;
      }

      // Penalty for out of stock
      if (product.stock === 0) {
        score *= 0.5;
      }

      // Boost for popularity (if we had sales data)
      // score += product.sales * 0.1;

      // Create highlights
      const highlights = this.createHighlights(product, queryTerms);

      results.push({
        product,
        score,
        highlights,
        matchedTerms: queryTerms,
      });
    }

    return results;
  }

  /**
   * Create search result highlights
   */
  private createHighlights(product: Product, terms: string[]): SearchResult['highlights'] {
    const highlights: SearchResult['highlights'] = {};

    // Highlight name
    let highlightedName = product.name;
    for (const term of terms) {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedName = highlightedName.replace(regex, '<mark>$1</mark>');
    }
    if (highlightedName !== product.name) {
      highlights.name = highlightedName;
    }

    // Highlight description excerpt
    const descLower = product.description.toLowerCase();
    for (const term of terms) {
      if (descLower.includes(term)) {
        const index = descLower.indexOf(term);
        const start = Math.max(0, index - 50);
        const end = Math.min(product.description.length, index + term.length + 50);
        let excerpt = product.description.substring(start, end);

        if (start > 0) excerpt = '...' + excerpt;
        if (end < product.description.length) excerpt = excerpt + '...';

        const regex = new RegExp(`(${term})`, 'gi');
        highlights.description = excerpt.replace(regex, '<mark>$1</mark>');
        break;
      }
    }

    return highlights;
  }

  /**
   * Apply search filters
   */
  private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
    if (!filters) return results;

    return results.filter(result => {
      const product = result.product;

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(product.category)) return false;
      }

      // Price range filter
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      // Stock filter
      if (filters.inStock && product.stock === 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], sort?: SortOption): SearchResult[] {
    if (!sort) {
      // Default: sort by relevance (score)
      return results.sort((a, b) => b.score - a.score);
    }

    const field = sort.field;
    const order = sort.order === 'asc' ? 1 : -1;

    return results.sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'relevance':
          comparison = b.score - a.score;
          break;
        case 'price':
          comparison = a.product.price - b.product.price;
          break;
        case 'name':
          comparison = a.product.name.localeCompare(b.product.name);
          break;
        case 'newest':
          comparison = b.product.createdAt.getTime() - a.product.createdAt.getTime();
          break;
        case 'popularity':
          // In production, would sort by sales/views
          comparison = b.score - a.score;
          break;
        default:
          comparison = b.score - a.score;
      }

      return comparison * order;
    });
  }

  /**
   * Calculate search facets for filtering
   */
  private calculateFacets(results: SearchResult[]): SearchFacets {
    const categoryCounts = new Map<string, number>();
    let inStock = 0;
    let outOfStock = 0;

    const priceRanges = [
      { range: 'Under $25', min: 0, max: 25, count: 0 },
      { range: '$25 - $50', min: 25, max: 50, count: 0 },
      { range: '$50 - $100', min: 50, max: 100, count: 0 },
      { range: '$100 - $200', min: 100, max: 200, count: 0 },
      { range: 'Over $200', min: 200, max: Infinity, count: 0 },
    ];

    for (const result of results) {
      const product = result.product;

      // Category counts
      categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1);

      // Stock counts
      if (product.stock > 0) {
        inStock++;
      } else {
        outOfStock++;
      }

      // Price range counts
      for (const range of priceRanges) {
        if (product.price >= range.min && product.price < range.max) {
          range.count++;
          break;
        }
      }
    }

    const categories = Array.from(categoryCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    return {
      categories,
      priceRanges: priceRanges.filter(r => r.count > 0),
      availability: { inStock, outOfStock },
    };
  }

  // ============================================================================
  // Autocomplete & Suggestions
  // ============================================================================

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(query: string, limit: number = 10): SearchSuggestion[] {
    if (query.length < 2) return [];

    const queryLower = query.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Product name suggestions
    const products = this.db.getProducts();
    for (const product of products) {
      if (product.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: product.name,
          type: 'product',
          score: product.name.toLowerCase().startsWith(queryLower) ? 2 : 1,
        });
      }
    }

    // Category suggestions
    const categories = new Set(products.map(p => p.category));
    for (const category of categories) {
      if (category.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: category,
          type: 'category',
          score: category.toLowerCase().startsWith(queryLower) ? 3 : 2,
        });
      }
    }

    // Popular search suggestions
    for (const [searchQuery, data] of this.searchHistory.entries()) {
      if (searchQuery.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: searchQuery,
          type: 'query',
          score: data.count / 10,
        });
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(query: string, terms: string[]): string[] {
    const suggestions: string[] = [];

    // Suggest related categories
    const products = this.db.getProducts();
    const categories = new Set<string>();

    for (const product of products) {
      const productText = `${product.name} ${product.description}`.toLowerCase();
      for (const term of terms) {
        if (productText.includes(term)) {
          categories.add(product.category);
        }
      }
    }

    for (const category of categories) {
      if (!query.toLowerCase().includes(category.toLowerCase())) {
        suggestions.push(`${query} in ${category}`);
      }
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Check spelling and suggest corrections
   */
  private checkSpelling(query: string): string {
    // Simple spelling correction based on indexed terms
    const queryTerms = this.tokenize(query);
    const correctedTerms: string[] = [];

    for (const term of queryTerms) {
      let bestMatch = term;
      let minDistance = Infinity;

      // Check against indexed terms
      for (const indexedTerm of this.productIndex.keys()) {
        const distance = this.levenshteinDistance(term, indexedTerm);
        if (distance < minDistance && distance <= 2) {
          minDistance = distance;
          bestMatch = indexedTerm;
        }
      }

      correctedTerms.push(bestMatch);
    }

    const corrected = correctedTerms.join(' ');
    return corrected !== queryTerms.join(' ') ? corrected : query;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // ============================================================================
  // Search Tracking & Analytics
  // ============================================================================

  /**
   * Track search query
   */
  private trackSearch(query: string) {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return;

    const existing = this.searchHistory.get(normalizedQuery);
    if (existing) {
      existing.count++;
      existing.lastSearched = new Date();
    } else {
      this.searchHistory.set(normalizedQuery, {
        query: normalizedQuery,
        count: 1,
        lastSearched: new Date(),
      });
    }
  }

  /**
   * Track user search history
   */
  trackUserSearch(sessionId: string, query: string) {
    let history = this.userSearchHistory.get(sessionId);
    if (!history) {
      history = [];
      this.userSearchHistory.set(sessionId, history);
    }

    history.unshift(query);

    // Keep only last 20 searches
    if (history.length > 20) {
      history.pop();
    }
  }

  /**
   * Get user's search history
   */
  getUserSearchHistory(sessionId: string, limit: number = 10): string[] {
    const history = this.userSearchHistory.get(sessionId) || [];
    return history.slice(0, limit);
  }

  /**
   * Get popular searches
   */
  getPopularSearches(limit: number = 10): PopularSearch[] {
    return Array.from(this.searchHistory.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get trending searches (recent popular searches)
   */
  getTrendingSearches(limit: number = 10): PopularSearch[] {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return Array.from(this.searchHistory.values())
      .filter(search => search.lastSearched.getTime() > oneDayAgo)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics() {
    const totalSearches = Array.from(this.searchHistory.values()).reduce(
      (sum, s) => sum + s.count,
      0
    );
    const uniqueQueries = this.searchHistory.size;
    const totalUsers = this.userSearchHistory.size;

    // Get top categories searched
    const categorySearches = new Map<string, number>();
    const products = this.db.getProducts();
    const categories = new Set(products.map(p => p.category));

    for (const [query, data] of this.searchHistory.entries()) {
      for (const category of categories) {
        if (query.includes(category.toLowerCase())) {
          categorySearches.set(category, (categorySearches.get(category) || 0) + data.count);
        }
      }
    }

    const topCategories = Array.from(categorySearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      totalSearches,
      uniqueQueries,
      totalUsers,
      averageSearchesPerUser: totalUsers > 0 ? totalSearches / totalUsers : 0,
      topCategories,
      popularSearches: this.getPopularSearches(5),
      trendingSearches: this.getTrendingSearches(5),
    };
  }

  /**
   * Get empty search response
   */
  private getEmptySearchResponse(startTime: number): SearchResponse {
    return {
      results: [],
      total: 0,
      page: 1,
      pages: 0,
      facets: {
        categories: [],
        priceRanges: [],
        availability: { inStock: 0, outOfStock: 0 },
      },
      searchTime: Date.now() - startTime,
    };
  }
}
