/**
 * Feed Generator - Personalized Feed Generation
 *
 * Generates personalized feeds using:
 * - python:sklearn for ranking models
 * - python:numpy for feature engineering
 * - ML-based ranking with engagement optimization
 *
 * Provides multiple feed algorithms with real-time updates.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  Post,
  User,
  FeedResponse,
  FeedMetadata,
  FeedAlgorithm,
  FeedRankingFeatures,
} from '../types';

/**
 * Feed generator configuration
 */
export interface FeedGeneratorConfig {
  // Algorithm settings
  defaultAlgorithm: FeedAlgorithm;
  enableMLRanking: boolean;
  enableEngagementOptimization: boolean;

  // Ranking model
  rankingModel: 'gradient_boosting' | 'random_forest' | 'linear';
  numEstimators: number;
  maxDepth: number;
  learningRate: number;

  // Feed composition
  maxCandidates: number;
  followingWeight: number;
  exploreWeight: number;
  trendingWeight: number;

  // Diversity
  enableDiversity: boolean;
  diversityThreshold: number;
  maxConsecutiveSameAuthor: number;

  // Caching
  cacheSize: number;
  cacheTTL: number; // seconds
  updateInterval: number; // seconds

  // Performance
  enablePrecompute: boolean;
  enableRealtime: boolean;
  maxConcurrentRequests: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FeedGeneratorConfig = {
  defaultAlgorithm: 'ml_ranker',
  enableMLRanking: true,
  enableEngagementOptimization: true,
  rankingModel: 'gradient_boosting',
  numEstimators: 100,
  maxDepth: 6,
  learningRate: 0.1,
  maxCandidates: 500,
  followingWeight: 0.5,
  exploreWeight: 0.3,
  trendingWeight: 0.2,
  enableDiversity: true,
  diversityThreshold: 0.3,
  maxConsecutiveSameAuthor: 2,
  cacheSize: 10000,
  cacheTTL: 300,
  updateInterval: 60,
  enablePrecompute: true,
  enableRealtime: true,
  maxConcurrentRequests: 50,
};

/**
 * FeedGenerator - Main feed generation class
 */
export class FeedGenerator {
  private config: FeedGeneratorConfig;
  private rankingModel: any;
  private feedCache: Map<string, { feed: Post[]; timestamp: number }>;
  private userScores: Map<string, Map<string, number>>;

  constructor(config: Partial<FeedGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.feedCache = new Map();
    this.userScores = new Map();
  }

  /**
   * Initialize feed generator
   */
  async initialize(): Promise<void> {
    console.log('Initializing FeedGenerator...');

    // Load or train ranking model
    if (this.config.enableMLRanking) {
      await this.loadRankingModel();
    }

    console.log('FeedGenerator initialized successfully');
  }

  /**
   * Generate personalized feed for user
   */
  async generateFeed(
    userId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<FeedResponse> {
    const startTime = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(userId, cursor);
    const cached = this.feedCache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return {
        posts: cached.feed.slice(0, limit),
        nextCursor: this.generateCursor(cached.feed[limit - 1]),
        hasMore: cached.feed.length > limit,
        metadata: {
          algorithm: this.config.defaultAlgorithm,
          candidateCount: cached.feed.length,
          generationTime: performance.now() - startTime,
          personalizedScore: 1.0,
        },
      };
    }

    // Get candidate posts
    const candidates = await this.getCandidates(userId, cursor, this.config.maxCandidates);

    // Rank candidates
    const ranked = await this.rankCandidates(userId, candidates);

    // Apply diversity optimization
    const diversified = this.config.enableDiversity
      ? this.optimizeDiversity(ranked)
      : ranked;

    // Cache feed
    this.feedCache.set(cacheKey, {
      feed: diversified,
      timestamp: Date.now(),
    });

    // Paginate
    const page = diversified.slice(0, limit);
    const nextCursor = page.length > 0 ? this.generateCursor(page[page.length - 1]) : undefined;

    const generationTime = performance.now() - startTime;

    return {
      posts: page,
      nextCursor,
      hasMore: diversified.length > limit,
      metadata: {
        algorithm: this.config.defaultAlgorithm,
        candidateCount: candidates.length,
        generationTime,
        personalizedScore: this.calculatePersonalizationScore(ranked),
        diversityScore: this.calculateDiversityScore(diversified),
      },
    };
  }

  /**
   * Get candidate posts for feed
   */
  async getCandidates(
    userId: string,
    cursor?: string,
    limit: number = 500
  ): Promise<Post[]> {
    // Get posts from different sources
    const [followingPosts, explorePosts, trendingPosts] = await Promise.all([
      this.getFollowingPosts(userId, cursor, Math.floor(limit * this.config.followingWeight)),
      this.getExplorePosts(userId, cursor, Math.floor(limit * this.config.exploreWeight)),
      this.getTrendingPosts(cursor, Math.floor(limit * this.config.trendingWeight)),
    ]);

    // Combine and deduplicate
    const combined = this.deduplicatePosts([
      ...followingPosts,
      ...explorePosts,
      ...trendingPosts,
    ]);

    return combined;
  }

  /**
   * Rank candidates using ML model
   */
  async rankCandidates(userId: string, candidates: Post[]): Promise<Post[]> {
    if (!this.config.enableMLRanking || !this.rankingModel) {
      // Fallback to engagement-based ranking
      return this.rankByEngagement(candidates);
    }

    // Extract features for each candidate
    const features = await Promise.all(
      candidates.map(post => this.extractRankingFeatures(userId, post))
    );

    // Convert to numpy array
    const featureMatrix = this.featuresToMatrix(features);

    // Predict scores
    const scores = this.rankingModel.predict_proba(featureMatrix);

    // Combine posts with scores
    const scored = candidates.map((post, idx) => ({
      post,
      score: scores[idx],
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored.map(item => item.post);
  }

  /**
   * Extract ranking features for a post
   */
  async extractRankingFeatures(userId: string, post: Post): Promise<FeedRankingFeatures> {
    // Post features
    const postAge = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60); // hours
    const engagementScore = this.calculateEngagementScore(post);
    const viralScore = post.engagement.viralCoefficient;
    const qualityScore = this.calculateQualityScore(post);

    // Author features
    const author = await this.getUserById(post.authorId);
    const authorFollowers = author?.followers || 0;
    const authorEngagementRate = author?.stats.engagementRate || 0;
    const isFollowing = await this.isFollowing(userId, post.authorId);
    const interactionHistory = await this.getInteractionHistory(userId, post.authorId);

    // Content features
    const topicRelevance = await this.calculateTopicRelevance(userId, post);
    const contentType = post.type;
    const hasMedia = post.media.length > 0;
    const sentimentScore = post.metadata.sentiment?.score || 0.5;

    // Context features
    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();
    const userActiveTime = await this.isUserActiveTime(userId, now);

    // Social features
    const mutualFollowers = await this.getMutualFollowers(userId, post.authorId);
    const socialDistance = await this.getSocialDistance(userId, post.authorId);
    const communityOverlap = await this.getCommunityOverlap(userId, post.authorId);

    return {
      postAge,
      engagementScore,
      viralScore,
      qualityScore,
      authorFollowers,
      authorEngagementRate,
      isFollowing,
      interactionHistory,
      topicRelevance,
      contentType,
      hasMedia,
      sentimentScore,
      timeOfDay,
      dayOfWeek,
      userActiveTime,
      mutualFollowers,
      socialDistance,
      communityOverlap,
    };
  }

  /**
   * Convert features to matrix for model
   */
  featuresToMatrix(features: FeedRankingFeatures[]): any {
    const matrix: number[][] = features.map(f => [
      f.postAge,
      f.engagementScore,
      f.viralScore,
      f.qualityScore,
      Math.log(f.authorFollowers + 1),
      f.authorEngagementRate,
      f.isFollowing ? 1 : 0,
      f.interactionHistory,
      f.topicRelevance,
      f.hasMedia ? 1 : 0,
      f.sentimentScore,
      f.timeOfDay / 24,
      f.dayOfWeek / 7,
      f.userActiveTime ? 1 : 0,
      Math.log(f.mutualFollowers + 1),
      f.socialDistance,
      f.communityOverlap,
    ]);

    return numpy.array(matrix);
  }

  /**
   * Load or train ranking model
   */
  async loadRankingModel(): Promise<void> {
    // In production, would load pre-trained model
    // For demo, create a simple model

    const { GradientBoostingClassifier, RandomForestClassifier, LinearRegression } = sklearn.ensemble;

    switch (this.config.rankingModel) {
      case 'gradient_boosting':
        this.rankingModel = GradientBoostingClassifier({
          n_estimators: this.config.numEstimators,
          max_depth: this.config.maxDepth,
          learning_rate: this.config.learningRate,
        });
        break;

      case 'random_forest':
        this.rankingModel = RandomForestClassifier({
          n_estimators: this.config.numEstimators,
          max_depth: this.config.maxDepth,
        });
        break;

      case 'linear':
        this.rankingModel = LinearRegression();
        break;
    }

    // Would train model on historical data
    console.log('Ranking model loaded');
  }

  /**
   * Optimize feed diversity
   */
  optimizeDiversity(posts: Post[]): Post[] {
    const diversified: Post[] = [];
    const authorCounts = new Map<string, number>();
    const topicCounts = new Map<string, number>();

    for (const post of posts) {
      // Check author diversity
      const authorCount = authorCounts.get(post.authorId) || 0;
      if (authorCount >= this.config.maxConsecutiveSameAuthor) {
        // Skip if too many consecutive posts from same author
        continue;
      }

      // Check topic diversity
      const topics = post.metadata.topics || [];
      let skipPost = false;

      for (const topic of topics) {
        const topicCount = topicCounts.get(topic) || 0;
        if (topicCount > posts.length * this.config.diversityThreshold) {
          skipPost = true;
          break;
        }
      }

      if (skipPost) continue;

      // Add post to diversified feed
      diversified.push(post);

      // Update counts
      authorCounts.set(post.authorId, authorCount + 1);
      for (const topic of topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }

      // Reset author count if different author
      if (diversified.length > 0 &&
          diversified[diversified.length - 1].authorId !== post.authorId) {
        for (const [author, _] of authorCounts) {
          if (author !== post.authorId) {
            authorCounts.set(author, 0);
          }
        }
      }
    }

    return diversified;
  }

  /**
   * Get real-time feed updates
   */
  async getRealtimeUpdates(userId: string, since: Date): Promise<Post[]> {
    if (!this.config.enableRealtime) {
      return [];
    }

    // Get recent posts from followed users
    const updates = await this.getRecentPosts(userId, since);

    // Quick scoring for real-time
    const scored = updates.map(post => ({
      post,
      score: this.fastScore(post, userId),
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored.map(item => item.post);
  }

  /**
   * Fast scoring for real-time updates
   */
  fastScore(post: Post, userId: string): number {
    // Simple heuristic scoring for real-time updates
    const engagementScore = this.calculateEngagementScore(post);
    const recencyScore = this.calculateRecencyScore(post);
    const authorScore = 0.5; // Would check follow relationship

    return engagementScore * 0.5 + recencyScore * 0.3 + authorScore * 0.2;
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(post: Post): number {
    const { likes, comments, shares, views } = post.engagement;

    if (views === 0) return 0;

    const likeRate = likes / views;
    const commentRate = comments / views;
    const shareRate = shares / views;

    return likeRate * 0.4 + commentRate * 0.4 + shareRate * 0.2;
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(post: Post): number {
    let score = 0.5;

    // Content length
    if (post.content.length > 100 && post.content.length < 2000) {
      score += 0.1;
    }

    // Has media
    if (post.media.length > 0) {
      score += 0.15;
    }

    // Sentiment (prefer positive)
    if (post.metadata.sentiment?.label === 'positive') {
      score += 0.1;
    }

    // Has entities/topics
    if (post.entities.length > 0) {
      score += 0.05;
    }

    // Reading time (prefer 1-5 minutes)
    const readingTime = post.metadata.readingTime || 0;
    if (readingTime >= 1 && readingTime <= 5) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate recency score with time decay
   */
  calculateRecencyScore(post: Post): number {
    const age = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60); // hours
    return Math.exp(-age / 24); // Decay over 24 hours
  }

  /**
   * Rank by engagement (fallback)
   */
  rankByEngagement(posts: Post[]): Post[] {
    return posts.sort((a, b) => {
      const scoreA = this.calculateEngagementScore(a);
      const scoreB = this.calculateEngagementScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate personalization score
   */
  calculatePersonalizationScore(posts: Post[]): number {
    // Measure how personalized the feed is
    // Higher score = more personalized
    return 0.8;
  }

  /**
   * Calculate diversity score
   */
  calculateDiversityScore(posts: Post[]): number {
    if (posts.length === 0) return 0;

    const uniqueAuthors = new Set(posts.map(p => p.authorId)).size;
    const uniqueTopics = new Set(posts.flatMap(p => p.metadata.topics || [])).size;

    const authorDiversity = uniqueAuthors / posts.length;
    const topicDiversity = uniqueTopics / posts.length;

    return (authorDiversity + topicDiversity) / 2;
  }

  /**
   * Deduplicate posts
   */
  deduplicatePosts(posts: Post[]): Post[] {
    const seen = new Set<string>();
    const unique: Post[] = [];

    for (const post of posts) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        unique.push(post);
      }
    }

    return unique;
  }

  /**
   * Helper methods for fetching data
   */

  async getFollowingPosts(userId: string, cursor?: string, limit: number = 100): Promise<Post[]> {
    // Would query database for posts from followed users
    return [];
  }

  async getExplorePosts(userId: string, cursor?: string, limit: number = 100): Promise<Post[]> {
    // Would query database for explore posts
    return [];
  }

  async getTrendingPosts(cursor?: string, limit: number = 100): Promise<Post[]> {
    // Would query database for trending posts
    return [];
  }

  async getRecentPosts(userId: string, since: Date): Promise<Post[]> {
    // Would query database for recent posts
    return [];
  }

  async getUserById(userId: string): Promise<User | null> {
    // Would query database
    return null;
  }

  async isFollowing(userId: string, targetId: string): Promise<boolean> {
    // Would check follow relationship
    return false;
  }

  async getInteractionHistory(userId: string, targetId: string): Promise<number> {
    // Would count interactions
    return 0;
  }

  async calculateTopicRelevance(userId: string, post: Post): Promise<number> {
    // Would calculate based on user preferences
    return 0.5;
  }

  async isUserActiveTime(userId: string, time: Date): Promise<boolean> {
    // Would check user activity patterns
    return true;
  }

  async getMutualFollowers(userId: string, targetId: string): Promise<number> {
    // Would count mutual followers
    return 0;
  }

  async getSocialDistance(userId: string, targetId: string): Promise<number> {
    // Would calculate social graph distance
    return 3;
  }

  async getCommunityOverlap(userId: string, targetId: string): Promise<number> {
    // Would calculate community overlap
    return 0.3;
  }

  /**
   * Cache management
   */

  getCacheKey(userId: string, cursor?: string): string {
    return `${userId}_${cursor || 'home'}`;
  }

  isCacheValid(timestamp: number): boolean {
    const age = (Date.now() - timestamp) / 1000;
    return age < this.config.cacheTTL;
  }

  generateCursor(post: Post): string {
    return `${post.createdAt.getTime()}_${post.id}`;
  }

  invalidateUserCache(userId: string): void {
    for (const key of this.feedCache.keys()) {
      if (key.startsWith(userId)) {
        this.feedCache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.feedCache.clear();
  }

  getStats(): any {
    return {
      cacheSize: this.feedCache.size,
      config: this.config,
    };
  }
}

/**
 * Create a default FeedGenerator instance
 */
export function createFeedGenerator(config?: Partial<FeedGeneratorConfig>): FeedGenerator {
  return new FeedGenerator(config);
}
