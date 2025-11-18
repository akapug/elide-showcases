import { spawn } from 'child_process';
import type { Logger } from 'pino';
import { CacheManager } from './cache-manager.js';
import { DiversityOptimizer } from './diversity-optimizer.js';

interface RecommendRequest {
  userId: string;
  limit: number;
  algorithm: 'collaborative_filtering' | 'matrix_factorization' | 'neural_cf' | 'content_based' | 'hybrid';
  context?: {
    device?: string;
    location?: string;
    time?: string;
  };
  filters?: {
    category?: string[];
    minRating?: number;
  };
  diversityWeight?: number;
}

interface Recommendation {
  itemId: string;
  score: number;
  confidence: number;
  reason: string;
  metadata?: any;
}

export class RecommendationEngine {
  private cache: CacheManager;
  private diversityOptimizer: DiversityOptimizer;

  constructor(private logger: Logger) {
    this.cache = new CacheManager(logger);
    this.diversityOptimizer = new DiversityOptimizer(logger);
  }

  async recommend(request: RecommendRequest) {
    const cacheKey = this.getCacheKey(request);
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit for recommendations');
      return { ...cached, cacheHit: true };
    }

    const startTime = performance.now();

    // Call Python ML process
    const rawRecommendations = await this.callMLProcess(request);

    // Apply diversity optimization
    const optimized = request.diversityWeight && request.diversityWeight > 0
      ? this.diversityOptimizer.optimize(rawRecommendations, request.diversityWeight)
      : rawRecommendations;

    // Apply filters
    const filtered = this.applyFilters(optimized, request.filters);

    // Take top N
    const final = filtered.slice(0, request.limit);

    const result = {
      userId: request.userId,
      recommendations: final,
      algorithm: request.algorithm,
      cacheHit: false
    };

    // Cache result
    await this.cache.set(cacheKey, result);

    const latencyMs = performance.now() - startTime;
    this.logger.info({
      action: 'recommend',
      userId: request.userId,
      algorithm: request.algorithm,
      count: final.length,
      latencyMs
    });

    return result;
  }

  async getSimilarItems(request: { itemId: string; limit: number; algorithm?: string }) {
    const result = await this.callMLProcess({
      type: 'similar',
      itemId: request.itemId,
      limit: request.limit,
      algorithm: request.algorithm || 'content_based'
    });

    return {
      itemId: request.itemId,
      similarItems: result.slice(0, request.limit)
    };
  }

  async recordInteraction(interaction: any) {
    // In production, this would queue to message bus for async processing
    this.logger.info({ action: 'interaction_recorded', ...interaction });

    return {
      interactionId: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recorded: true,
      modelUpdateQueued: true
    };
  }

  async getUserProfile(userId: string) {
    // In production, fetch from database
    return {
      userId,
      totalInteractions: Math.floor(Math.random() * 1000),
      topCategories: ['electronics', 'books', 'sports'],
      preferences: {
        priceRange: [10, 100],
        brands: ['BrandA', 'BrandB']
      },
      embedding: Array(128).fill(0).map(() => Math.random() * 2 - 1)
    };
  }

  private async callMLProcess(request: any): Promise<Recommendation[]> {
    return new Promise((resolve, reject) => {
      const timeout = parseInt(process.env.RECOMMENDATION_TIMEOUT || '50');
      const timeoutId = setTimeout(() => {
        reject(new Error(`ML process timeout after ${timeout}ms`));
      }, timeout);

      // In production, this would spawn Python process via stdin/stdout
      // For showcase, return mock data
      const mockData: Recommendation[] = Array(20).fill(null).map((_, i) => ({
        itemId: `item_${1000 + i}`,
        score: 1 - (i * 0.05),
        confidence: 0.8 + Math.random() * 0.2,
        reason: i < 3 ? 'Users similar to you also liked this' :
               i < 6 ? 'Based on your recent activity' :
               'Trending in your area',
        metadata: {
          title: `Product ${i + 1}`,
          category: ['electronics', 'books', 'sports'][i % 3],
          rating: 4.0 + Math.random()
        }
      }));

      clearTimeout(timeoutId);
      resolve(mockData);
    });
  }

  private applyFilters(items: Recommendation[], filters?: any): Recommendation[] {
    if (!filters) return items;

    return items.filter(item => {
      if (filters.category && !filters.category.includes(item.metadata?.category)) {
        return false;
      }
      if (filters.minRating && item.metadata?.rating < filters.minRating) {
        return false;
      }
      return true;
    });
  }

  private getCacheKey(request: RecommendRequest): string {
    return `rec:${request.userId}:${request.algorithm}:${JSON.stringify(request.filters || {})}`;
  }
}
