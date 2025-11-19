/**
 * Recommendation Engine - ML-Powered Content Recommendations
 *
 * Implements multiple recommendation algorithms using:
 * - python:sklearn for collaborative filtering (SVD, matrix factorization)
 * - python:numpy for numerical computations
 * - python:transformers for content embeddings
 *
 * Provides personalized content recommendations with hybrid approaches.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import transformers from 'python:transformers';

import type {
  Post,
  User,
  RecommendationScore,
  RecommendationAlgorithm,
  RecommendationContext,
  UserActivity,
  CollaborativeFilteringModel,
  ContentBasedModel,
  FeatureVector,
} from '../types';

/**
 * Recommendation engine configuration
 */
export interface RecommendationEngineConfig {
  // Algorithm selection
  defaultAlgorithm: RecommendationAlgorithm;
  enableCollaborativeFiltering: boolean;
  enableContentBased: boolean;
  enableHybrid: boolean;
  enableTrending: boolean;

  // Collaborative filtering
  numFactors: number;
  regularization: number;
  iterations: number;
  learningRate: number;

  // Content-based
  embeddingModel: string;
  similarityMetric: 'cosine' | 'euclidean' | 'dot_product';

  // Hybrid weights
  collaborativeWeight: number;
  contentBasedWeight: number;
  trendingWeight: number;
  socialGraphWeight: number;

  // Diversity
  enableDiversity: boolean;
  diversityWeight: number;
  noveltyWeight: number;

  // Cold start
  enableColdStart: boolean;
  coldStartStrategy: 'popular' | 'trending' | 'random';

  // Performance
  maxCandidates: number;
  minConfidence: number;
  updateInterval: number; // seconds
  enableCaching: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RecommendationEngineConfig = {
  defaultAlgorithm: 'hybrid',
  enableCollaborativeFiltering: true,
  enableContentBased: true,
  enableHybrid: true,
  enableTrending: true,
  numFactors: 100,
  regularization: 0.01,
  iterations: 20,
  learningRate: 0.01,
  embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
  similarityMetric: 'cosine',
  collaborativeWeight: 0.4,
  contentBasedWeight: 0.3,
  trendingWeight: 0.2,
  socialGraphWeight: 0.1,
  enableDiversity: true,
  diversityWeight: 0.15,
  noveltyWeight: 0.1,
  enableColdStart: true,
  coldStartStrategy: 'trending',
  maxCandidates: 1000,
  minConfidence: 0.3,
  updateInterval: 300,
  enableCaching: true,
};

/**
 * RecommendationEngine - Main recommendation class
 */
export class RecommendationEngine {
  private config: RecommendationEngineConfig;
  private collaborativeModel?: CollaborativeFilteringModel;
  private contentBasedModel?: ContentBasedModel;
  private userInteractionMatrix: Map<string, Map<string, number>>;
  private postEmbeddings: Map<string, number[]>;
  private userProfiles: Map<string, number[]>;
  private embeddingModel: any;
  private recommendationCache: Map<string, RecommendationScore[]>;
  private lastUpdate: number;

  constructor(config: Partial<RecommendationEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.userInteractionMatrix = new Map();
    this.postEmbeddings = new Map();
    this.userProfiles = new Map();
    this.recommendationCache = new Map();
    this.lastUpdate = 0;
  }

  /**
   * Initialize recommendation engine
   */
  async initialize(): Promise<void> {
    console.log('Initializing RecommendationEngine...');

    // Load embedding model for content-based recommendations
    if (this.config.enableContentBased) {
      const { AutoModel, AutoTokenizer } = transformers;
      this.embeddingModel = {
        tokenizer: AutoTokenizer.from_pretrained(this.config.embeddingModel),
        model: AutoModel.from_pretrained(this.config.embeddingModel),
      };
    }

    console.log('RecommendationEngine initialized successfully');
  }

  /**
   * Get recommendations for a user
   */
  async getRecommendations(
    userId: string,
    context?: RecommendationContext,
    limit: number = 20
  ): Promise<Post[]> {
    // Check cache
    const cacheKey = this.getCacheKey(userId, this.config.defaultAlgorithm);
    if (this.config.enableCaching && this.recommendationCache.has(cacheKey)) {
      const cached = this.recommendationCache.get(cacheKey)!;
      return this.scoresToPosts(cached.slice(0, limit));
    }

    // Get recommendations based on algorithm
    let scores: RecommendationScore[];

    switch (this.config.defaultAlgorithm) {
      case 'collaborative_filtering':
        scores = await this.getCollaborativeRecommendations(userId, limit * 2);
        break;
      case 'content_based':
        scores = await this.getContentBasedRecommendations(userId, limit * 2);
        break;
      case 'hybrid':
        scores = await this.getHybridRecommendations(userId, limit * 2);
        break;
      case 'trending':
        scores = await this.getTrendingRecommendations(userId, limit * 2);
        break;
      default:
        scores = await this.getHybridRecommendations(userId, limit * 2);
    }

    // Apply diversity optimization
    if (this.config.enableDiversity) {
      scores = this.optimizeDiversity(scores, this.config.diversityWeight);
    }

    // Filter by confidence threshold
    scores = scores.filter(s => s.confidence >= this.config.minConfidence);

    // Cache results
    if (this.config.enableCaching) {
      this.recommendationCache.set(cacheKey, scores);
    }

    // Convert to posts
    return this.scoresToPosts(scores.slice(0, limit));
  }

  /**
   * Collaborative filtering recommendations using SVD
   */
  async getCollaborativeRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    // Build or update model if needed
    if (!this.collaborativeModel || this.shouldUpdateModel()) {
      await this.trainCollaborativeModel();
    }

    // Get user index
    const userIndex = this.getUserIndex(userId);
    if (userIndex === -1) {
      // Cold start - return popular items
      return this.getColdStartRecommendations(userId, limit);
    }

    // Get user factors
    const userFactors = this.collaborativeModel!.userFactors[userIndex];

    // Compute predicted ratings for all items
    const predictions = this.predictRatings(userFactors);

    // Get top predictions
    const topIndices = this.getTopIndices(predictions, limit * 2);

    // Convert to scores
    const scores: RecommendationScore[] = [];
    for (const index of topIndices) {
      const postId = this.getPostIdByIndex(index);
      if (postId) {
        scores.push({
          itemId: postId,
          score: predictions[index],
          features: this.extractCollaborativeFeatures(userIndex, index),
          algorithm: 'collaborative_filtering',
          confidence: this.calculateConfidence(predictions[index]),
          explanation: ['Based on similar users\' preferences'],
        });
      }
    }

    return scores;
  }

  /**
   * Content-based recommendations using embeddings
   */
  async getContentBasedRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    // Get or build user profile
    let userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      userProfile = await this.buildUserProfile(userId);
      this.userProfiles.set(userId, userProfile);
    }

    // Get candidate posts
    const candidates = await this.getCandidatePosts(userId, this.config.maxCandidates);

    // Calculate similarities
    const scores: RecommendationScore[] = [];
    for (const post of candidates) {
      const postEmbedding = await this.getPostEmbedding(post.id);
      const similarity = this.calculateSimilarity(userProfile, postEmbedding);

      scores.push({
        itemId: post.id,
        score: similarity,
        features: this.extractContentFeatures(post),
        algorithm: 'content_based',
        confidence: this.calculateConfidence(similarity),
        explanation: ['Based on your content preferences'],
      });
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, limit);
  }

  /**
   * Hybrid recommendations combining multiple approaches
   */
  async getHybridRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    // Get recommendations from different algorithms
    const [collaborative, contentBased, trending] = await Promise.all([
      this.config.enableCollaborativeFiltering
        ? this.getCollaborativeRecommendations(userId, limit * 2)
        : [],
      this.config.enableContentBased
        ? this.getContentBasedRecommendations(userId, limit * 2)
        : [],
      this.config.enableTrending
        ? this.getTrendingRecommendations(userId, limit * 2)
        : [],
    ]);

    // Combine with weights
    const combined = this.blendRecommendations({
      collaborative,
      contentBased,
      trending,
    });

    // Sort by final score
    combined.sort((a, b) => b.score - a.score);

    return combined.slice(0, limit);
  }

  /**
   * Trending recommendations
   */
  async getTrendingRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    // Get trending posts (would query database in production)
    const trendingPosts = await this.getTrendingPosts(limit * 2);

    // Calculate personalized scores
    const scores: RecommendationScore[] = [];
    for (const post of trendingPosts) {
      const trendScore = this.calculateTrendScore(post);
      const personalizedScore = await this.personalizeScore(userId, post, trendScore);

      scores.push({
        itemId: post.id,
        score: personalizedScore,
        features: this.extractTrendingFeatures(post),
        algorithm: 'trending',
        confidence: 0.8,
        explanation: ['Trending content matching your interests'],
      });
    }

    return scores;
  }

  /**
   * Train collaborative filtering model using SVD
   */
  async trainCollaborativeModel(): Promise<void> {
    console.log('Training collaborative filtering model...');

    // Build interaction matrix
    const { userIds, postIds, matrix } = this.buildInteractionMatrix();

    // Convert to numpy array
    const npMatrix = numpy.array(matrix);

    // Apply SVD using sklearn
    const { TruncatedSVD } = sklearn.decomposition;
    const svd = TruncatedSVD({ n_components: this.config.numFactors });

    // Fit and transform
    const userFactors = svd.fit_transform(npMatrix);
    const itemFactors = svd.components_.T;

    // Calculate biases
    const userBias = this.calculateUserBiases(npMatrix);
    const itemBias = this.calculateItemBiases(npMatrix);
    const globalBias = npMatrix[npMatrix > 0].mean();

    // Store model
    this.collaborativeModel = {
      userFactors: Array.from(userFactors),
      itemFactors: Array.from(itemFactors),
      userBias: Array.from(userBias),
      itemBias: Array.from(itemBias),
      globalBias,
      numFactors: this.config.numFactors,
    };

    this.lastUpdate = Date.now();
    console.log('Collaborative filtering model trained successfully');
  }

  /**
   * Build interaction matrix from user activities
   */
  buildInteractionMatrix(): any {
    const userIds: string[] = [];
    const postIds: string[] = [];
    const userMap = new Map<string, number>();
    const postMap = new Map<string, number>();

    // Collect unique users and posts
    for (const [userId, interactions] of this.userInteractionMatrix) {
      if (!userMap.has(userId)) {
        userMap.set(userId, userIds.length);
        userIds.push(userId);
      }

      for (const [postId, _] of interactions) {
        if (!postMap.has(postId)) {
          postMap.set(postId, postIds.length);
          postIds.push(postId);
        }
      }
    }

    // Build matrix
    const matrix: number[][] = Array(userIds.length)
      .fill(0)
      .map(() => Array(postIds.length).fill(0));

    for (const [userId, interactions] of this.userInteractionMatrix) {
      const userIdx = userMap.get(userId)!;
      for (const [postId, score] of interactions) {
        const postIdx = postMap.get(postId)!;
        matrix[userIdx][postIdx] = score;
      }
    }

    return { userIds, postIds, matrix, userMap, postMap };
  }

  /**
   * Build user profile from interaction history
   */
  async buildUserProfile(userId: string): Promise<number[]> {
    // Get user's interaction history
    const interactions = this.userInteractionMatrix.get(userId);
    if (!interactions || interactions.size === 0) {
      // Return zero vector for cold start
      return Array(384).fill(0); // 384 is typical embedding dimension
    }

    // Get embeddings of interacted posts
    const embeddings: number[][] = [];
    const weights: number[] = [];

    for (const [postId, score] of interactions) {
      const embedding = await this.getPostEmbedding(postId);
      if (embedding) {
        embeddings.push(embedding);
        weights.push(score);
      }
    }

    if (embeddings.length === 0) {
      return Array(384).fill(0);
    }

    // Weighted average of embeddings
    const npEmbeddings = numpy.array(embeddings);
    const npWeights = numpy.array(weights);
    const weightedSum = numpy.dot(npWeights, npEmbeddings);
    const profile = weightedSum / npWeights.sum();

    return Array.from(profile);
  }

  /**
   * Get post embedding
   */
  async getPostEmbedding(postId: string): Promise<number[]> {
    // Check cache
    if (this.postEmbeddings.has(postId)) {
      return this.postEmbeddings.get(postId)!;
    }

    // Generate embedding (would fetch post content in production)
    const post = await this.getPostById(postId);
    if (!post || !post.embedding) {
      return Array(384).fill(0);
    }

    const embedding = post.embedding.vector;
    this.postEmbeddings.set(postId, embedding);

    return embedding;
  }

  /**
   * Calculate similarity between embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    const np1 = numpy.array(embedding1);
    const np2 = numpy.array(embedding2);

    switch (this.config.similarityMetric) {
      case 'cosine':
        return this.cosineSimilarity(np1, np2);
      case 'euclidean':
        return 1 / (1 + this.euclideanDistance(np1, np2));
      case 'dot_product':
        return numpy.dot(np1, np2);
      default:
        return this.cosineSimilarity(np1, np2);
    }
  }

  /**
   * Cosine similarity
   */
  cosineSimilarity(a: any, b: any): number {
    const dotProduct = numpy.dot(a, b);
    const normA = numpy.linalg.norm(a);
    const normB = numpy.linalg.norm(b);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Euclidean distance
   */
  euclideanDistance(a: any, b: any): number {
    return numpy.linalg.norm(a - b);
  }

  /**
   * Blend recommendations from multiple algorithms
   */
  blendRecommendations(recommendations: {
    collaborative: RecommendationScore[];
    contentBased: RecommendationScore[];
    trending: RecommendationScore[];
  }): RecommendationScore[] {
    const scoreMap = new Map<string, RecommendationScore>();

    // Add collaborative scores
    for (const rec of recommendations.collaborative) {
      scoreMap.set(rec.itemId, {
        ...rec,
        score: rec.score * this.config.collaborativeWeight,
      });
    }

    // Add content-based scores
    for (const rec of recommendations.contentBased) {
      const existing = scoreMap.get(rec.itemId);
      if (existing) {
        existing.score += rec.score * this.config.contentBasedWeight;
        existing.explanation = [...(existing.explanation || []), ...(rec.explanation || [])];
      } else {
        scoreMap.set(rec.itemId, {
          ...rec,
          score: rec.score * this.config.contentBasedWeight,
        });
      }
    }

    // Add trending scores
    for (const rec of recommendations.trending) {
      const existing = scoreMap.get(rec.itemId);
      if (existing) {
        existing.score += rec.score * this.config.trendingWeight;
        existing.explanation = [...(existing.explanation || []), ...(rec.explanation || [])];
      } else {
        scoreMap.set(rec.itemId, {
          ...rec,
          score: rec.score * this.config.trendingWeight,
        });
      }
    }

    return Array.from(scoreMap.values());
  }

  /**
   * Optimize for diversity
   */
  optimizeDiversity(
    recommendations: RecommendationScore[],
    diversityWeight: number
  ): RecommendationScore[] {
    // Use Maximal Marginal Relevance (MMR) for diversity
    const selected: RecommendationScore[] = [];
    const remaining = [...recommendations];

    while (remaining.length > 0 && selected.length < recommendations.length) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const relevance = candidate.score;

        // Calculate diversity (minimum similarity to selected items)
        let minSimilarity = 1.0;
        for (const selectedRec of selected) {
          const similarity = await this.calculateItemSimilarity(
            candidate.itemId,
            selectedRec.itemId
          );
          minSimilarity = Math.min(minSimilarity, similarity);
        }

        // MMR score
        const mmrScore = (1 - diversityWeight) * relevance + diversityWeight * (1 - minSimilarity);

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIdx = i;
        }
      }

      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    return selected;
  }

  /**
   * Calculate similarity between items
   */
  async calculateItemSimilarity(itemId1: string, itemId2: string): Promise<number> {
    const embedding1 = await this.getPostEmbedding(itemId1);
    const embedding2 = await this.getPostEmbedding(itemId2);
    return this.calculateSimilarity(embedding1, embedding2);
  }

  /**
   * Cold start recommendations
   */
  async getColdStartRecommendations(
    userId: string,
    limit: number
  ): Promise<RecommendationScore[]> {
    switch (this.config.coldStartStrategy) {
      case 'popular':
        return this.getPopularRecommendations(limit);
      case 'trending':
        return this.getTrendingRecommendations(userId, limit);
      case 'random':
        return this.getRandomRecommendations(limit);
      default:
        return this.getTrendingRecommendations(userId, limit);
    }
  }

  /**
   * Get popular recommendations
   */
  async getPopularRecommendations(limit: number): Promise<RecommendationScore[]> {
    // Would query database for most engaged posts
    return [];
  }

  /**
   * Get random recommendations
   */
  async getRandomRecommendations(limit: number): Promise<RecommendationScore[]> {
    // Would query database for random posts
    return [];
  }

  /**
   * Record user interaction
   */
  async recordInteraction(activity: UserActivity): Promise<void> {
    const { userId, itemId, type } = activity;

    // Calculate interaction score based on type
    const score = this.getInteractionScore(type);

    // Update interaction matrix
    if (!this.userInteractionMatrix.has(userId)) {
      this.userInteractionMatrix.set(userId, new Map());
    }

    const userInteractions = this.userInteractionMatrix.get(userId)!;
    const currentScore = userInteractions.get(itemId) || 0;
    userInteractions.set(itemId, currentScore + score);

    // Invalidate cache
    this.invalidateUserCache(userId);
  }

  /**
   * Get interaction score based on activity type
   */
  getInteractionScore(type: string): number {
    const scores: Record<string, number> = {
      view: 0.1,
      like: 0.5,
      comment: 0.7,
      share: 0.9,
      save: 1.0,
      click: 0.3,
    };
    return scores[type] || 0;
  }

  /**
   * Helper methods
   */

  predictRatings(userFactors: number[]): number[] {
    const npUserFactors = numpy.array(userFactors);
    const npItemFactors = numpy.array(this.collaborativeModel!.itemFactors);
    const predictions = numpy.dot(npUserFactors, npItemFactors.T);
    return Array.from(predictions);
  }

  getTopIndices(predictions: number[], k: number): number[] {
    const indexed = predictions.map((score, idx) => ({ score, idx }));
    indexed.sort((a, b) => b.score - a.score);
    return indexed.slice(0, k).map(item => item.idx);
  }

  getUserIndex(userId: string): number {
    // Would maintain user index mapping
    return -1;
  }

  getPostIdByIndex(index: number): string | null {
    // Would maintain post index mapping
    return null;
  }

  calculateUserBiases(matrix: any): number[] {
    // Calculate per-user biases
    return Array(matrix.shape[0]).fill(0);
  }

  calculateItemBiases(matrix: any): number[] {
    // Calculate per-item biases
    return Array(matrix.shape[1]).fill(0);
  }

  calculateConfidence(score: number): number {
    // Normalize score to confidence
    return Math.min(Math.max(score, 0), 1);
  }

  extractCollaborativeFeatures(userIdx: number, itemIdx: number): FeatureVector {
    return {
      collaborative_score: 1.0,
    };
  }

  extractContentFeatures(post: Post): FeatureVector {
    return {
      content_similarity: 1.0,
    };
  }

  extractTrendingFeatures(post: Post): FeatureVector {
    return {
      trending_score: 1.0,
      viral_coefficient: post.engagement.viralCoefficient,
    };
  }

  calculateTrendScore(post: Post): number {
    // Calculate trend score based on engagement velocity
    const age = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60); // hours
    const engagementRate = post.engagement.engagementRate;
    return engagementRate / (1 + age);
  }

  async personalizeScore(userId: string, post: Post, baseScore: number): Promise<number> {
    // Personalize based on user preferences
    return baseScore;
  }

  async getCandidatePosts(userId: string, limit: number): Promise<Post[]> {
    // Would query database for candidate posts
    return [];
  }

  async getTrendingPosts(limit: number): Promise<Post[]> {
    // Would query database for trending posts
    return [];
  }

  async getPostById(postId: string): Promise<Post | null> {
    // Would query database
    return null;
  }

  scoresToPosts(scores: RecommendationScore[]): Post[] {
    // Would fetch posts from database
    return [];
  }

  shouldUpdateModel(): boolean {
    const elapsed = Date.now() - this.lastUpdate;
    return elapsed > this.config.updateInterval * 1000;
  }

  getCacheKey(userId: string, algorithm: RecommendationAlgorithm): string {
    return `${userId}_${algorithm}`;
  }

  invalidateUserCache(userId: string): void {
    for (const key of this.recommendationCache.keys()) {
      if (key.startsWith(userId)) {
        this.recommendationCache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.recommendationCache.clear();
  }

  getStats(): any {
    return {
      users: this.userInteractionMatrix.size,
      postEmbeddings: this.postEmbeddings.size,
      userProfiles: this.userProfiles.size,
      cacheSize: this.recommendationCache.size,
      lastUpdate: new Date(this.lastUpdate),
      config: this.config,
    };
  }
}

/**
 * Create a default RecommendationEngine instance
 */
export function createRecommendationEngine(
  config?: Partial<RecommendationEngineConfig>
): RecommendationEngine {
  return new RecommendationEngine(config);
}
