/**
 * Social Graph - Social Network Analysis and Recommendations
 *
 * Manages social connections using:
 * - python:sklearn for clustering and similarity calculations
 * - python:numpy for graph computations
 *
 * Provides friend recommendations, influence analysis, and community detection.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  User,
  SocialGraph as SocialGraphType,
  InfluenceMetrics,
  Community,
  FriendRecommendation,
  RecommendationReason,
} from '../types';

/**
 * Social graph configuration
 */
export interface SocialGraphConfig {
  // Recommendations
  maxRecommendations: number;
  recommendationThreshold: number;

  // Community detection
  enableCommunityDetection: boolean;
  numCommunities: number;
  communityUpdateInterval: number;

  // Influence
  enableInfluenceScoring: boolean;
  influenceAlgorithm: 'pagerank' | 'betweenness' | 'degree';

  // Graph analysis
  maxGraphDepth: number;
  maxGraphSize: number;

  // Performance
  enableCaching: boolean;
  cacheTTL: number;
}

const DEFAULT_CONFIG: SocialGraphConfig = {
  maxRecommendations: 50,
  recommendationThreshold: 0.3,
  enableCommunityDetection: true,
  numCommunities: 10,
  communityUpdateInterval: 3600,
  enableInfluenceScoring: true,
  influenceAlgorithm: 'pagerank',
  maxGraphDepth: 3,
  maxGraphSize: 10000,
  enableCaching: true,
  cacheTTL: 300,
};

/**
 * SocialGraph - Main social graph class
 */
export class SocialGraph {
  private config: SocialGraphConfig;
  private graphs: Map<string, SocialGraphType>;
  private adjacencyMatrix: Map<string, number[][]>;
  private influenceCache: Map<string, InfluenceMetrics>;
  private communityCache: Map<string, Community[]>;
  private recommendationCache: Map<string, FriendRecommendation[]>;

  constructor(config: Partial<SocialGraphConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.graphs = new Map();
    this.adjacencyMatrix = new Map();
    this.influenceCache = new Map();
    this.communityCache = new Map();
    this.recommendationCache = new Map();
  }

  /**
   * Get friend recommendations for user
   */
  async getFriendRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<FriendRecommendation[]> {
    // Check cache
    const cacheKey = `recommendations_${userId}`;
    if (this.config.enableCaching && this.recommendationCache.has(cacheKey)) {
      return this.recommendationCache.get(cacheKey)!.slice(0, limit);
    }

    // Get user's graph
    const graph = await this.getUserGraph(userId);

    // Find friends-of-friends
    const fofCandidates = await this.findFriendsOfFriends(userId, graph);

    // Calculate recommendation scores
    const recommendations: FriendRecommendation[] = [];

    for (const candidateId of fofCandidates) {
      if (candidateId === userId) continue;
      if (graph.following.includes(candidateId)) continue;

      const score = await this.calculateRecommendationScore(userId, candidateId, graph);

      if (score >= this.config.recommendationThreshold) {
        const reasons = await this.generateRecommendationReasons(userId, candidateId, graph);
        const mutualFollowers = await this.getMutualFollowers(userId, candidateId);
        const commonInterests = await this.getCommonInterests(userId, candidateId);
        const socialDistance = await this.calculateSocialDistance(userId, candidateId, graph);

        recommendations.push({
          userId: candidateId,
          score,
          reasons,
          mutualFollowers,
          commonInterests,
          socialDistance,
        });
      }
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Cache results
    if (this.config.enableCaching) {
      this.recommendationCache.set(cacheKey, recommendations);
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Calculate friend recommendation score
   */
  async calculateRecommendationScore(
    userId: string,
    candidateId: string,
    graph: SocialGraphType
  ): Promise<number> {
    let score = 0;

    // Mutual followers weight
    const mutualFollowers = await this.getMutualFollowers(userId, candidateId);
    score += Math.min(mutualFollowers / 10, 0.4);

    // Common interests weight
    const commonInterests = await this.getCommonInterests(userId, candidateId);
    score += Math.min(commonInterests.length / 5, 0.3);

    // Social proximity weight
    const distance = await this.calculateSocialDistance(userId, candidateId, graph);
    score += distance === 2 ? 0.2 : distance === 3 ? 0.1 : 0;

    // Activity similarity weight
    const similarity = await this.calculateActivitySimilarity(userId, candidateId);
    score += similarity * 0.1;

    return score;
  }

  /**
   * Find friends-of-friends
   */
  async findFriendsOfFriends(
    userId: string,
    graph: SocialGraphType
  ): Promise<string[]> {
    const fof = new Set<string>();

    // Get direct friends
    const friends = graph.following;

    // Get friends of each friend
    for (const friendId of friends) {
      const friendGraph = await this.getUserGraph(friendId);
      for (const fofId of friendGraph.following) {
        if (fofId !== userId && !friends.includes(fofId)) {
          fof.add(fofId);
        }
      }
    }

    return Array.from(fof);
  }

  /**
   * Generate recommendation reasons
   */
  async generateRecommendationReasons(
    userId: string,
    candidateId: string,
    graph: SocialGraphType
  ): Promise<RecommendationReason[]> {
    const reasons: RecommendationReason[] = [];

    // Mutual followers
    const mutualFollowers = await this.getMutualFollowers(userId, candidateId);
    if (mutualFollowers > 0) {
      reasons.push({
        type: 'mutual_followers',
        description: `${mutualFollowers} mutual follower${mutualFollowers > 1 ? 's' : ''}`,
        strength: Math.min(mutualFollowers / 10, 1),
      });
    }

    // Common interests
    const commonInterests = await this.getCommonInterests(userId, candidateId);
    if (commonInterests.length > 0) {
      reasons.push({
        type: 'common_interests',
        description: `Interested in ${commonInterests.slice(0, 3).join(', ')}`,
        strength: Math.min(commonInterests.length / 5, 1),
      });
    }

    // Social proximity
    const distance = await this.calculateSocialDistance(userId, candidateId, graph);
    if (distance <= 3) {
      reasons.push({
        type: 'similar_activity',
        description: `${distance} connection${distance > 1 ? 's' : ''} away`,
        strength: 1 - (distance / 4),
      });
    }

    // Location proximity
    const sameLocation = await this.checkSameLocation(userId, candidateId);
    if (sameLocation) {
      reasons.push({
        type: 'location_proximity',
        description: 'From the same area',
        strength: 0.7,
      });
    }

    return reasons;
  }

  /**
   * Analyze user influence
   */
  async analyzeInfluence(userId: string): Promise<InfluenceMetrics> {
    // Check cache
    if (this.config.enableCaching && this.influenceCache.has(userId)) {
      return this.influenceCache.get(userId)!;
    }

    const graph = await this.getUserGraph(userId);

    // Calculate different influence metrics
    const pageRank = await this.calculatePageRank(userId, graph);
    const betweenness = await this.calculateBetweenness(userId, graph);
    const clustering = await this.calculateClustering(userId, graph);
    const reach = await this.calculateReach(userId, graph, 2);
    const engagementInfluence = await this.calculateEngagementInfluence(userId);

    const metrics: InfluenceMetrics = {
      userId,
      followers: graph.followers.length,
      following: graph.following.length,
      pageRank,
      betweenness,
      clustering,
      reach,
      engagementInfluence,
      communityInfluence: 0,
      overallScore: this.calculateOverallInfluence({
        pageRank,
        betweenness,
        reach,
        engagementInfluence,
      }),
    };

    // Cache metrics
    if (this.config.enableCaching) {
      this.influenceCache.set(userId, metrics);
    }

    return metrics;
  }

  /**
   * Calculate PageRank
   */
  async calculatePageRank(userId: string, graph: SocialGraphType): Promise<number> {
    // Simplified PageRank calculation
    // In production, would use full PageRank algorithm on entire graph

    const followers = graph.followers.length;
    const following = graph.following.length;

    if (followers === 0) return 0;

    // Basic score based on follower/following ratio
    const ratio = following > 0 ? followers / following : followers;
    return Math.min(Math.log(ratio + 1) / 10, 1);
  }

  /**
   * Calculate betweenness centrality
   */
  async calculateBetweenness(userId: string, graph: SocialGraphType): Promise<number> {
    // Simplified betweenness calculation
    // In production, would calculate actual shortest paths

    return 0.5;
  }

  /**
   * Calculate clustering coefficient
   */
  async calculateClustering(userId: string, graph: SocialGraphType): Promise<number> {
    const following = graph.following;

    if (following.length < 2) return 0;

    // Count connections between friends
    let connections = 0;
    const possibleConnections = (following.length * (following.length - 1)) / 2;

    for (let i = 0; i < following.length; i++) {
      for (let j = i + 1; j < following.length; j++) {
        if (await this.areConnected(following[i], following[j])) {
          connections++;
        }
      }
    }

    return connections / possibleConnections;
  }

  /**
   * Calculate reach (k-hop neighbors)
   */
  async calculateReach(
    userId: string,
    graph: SocialGraphType,
    depth: number
  ): Promise<number> {
    const visited = new Set<string>([userId]);
    let currentLevel = new Set(graph.following);

    for (let i = 1; i < depth; i++) {
      const nextLevel = new Set<string>();

      for (const nodeId of currentLevel) {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          const nodeGraph = await this.getUserGraph(nodeId);
          for (const followingId of nodeGraph.following) {
            if (!visited.has(followingId)) {
              nextLevel.add(followingId);
            }
          }
        }
      }

      currentLevel = nextLevel;
    }

    return visited.size;
  }

  /**
   * Calculate engagement influence
   */
  async calculateEngagementInfluence(userId: string): Promise<number> {
    // Would calculate based on average engagement rate
    // For demo, return placeholder
    return 0.7;
  }

  /**
   * Calculate overall influence score
   */
  calculateOverallInfluence(metrics: any): number {
    return (
      metrics.pageRank * 0.3 +
      metrics.betweenness * 0.2 +
      Math.min(metrics.reach / 1000, 1) * 0.2 +
      metrics.engagementInfluence * 0.3
    );
  }

  /**
   * Detect communities
   */
  async detectCommunities(userId: string): Promise<Community[]> {
    // Check cache
    const cacheKey = `communities_${userId}`;
    if (this.config.enableCaching && this.communityCache.has(cacheKey)) {
      return this.communityCache.get(cacheKey)!;
    }

    // Get extended graph
    const graph = await this.getExtendedGraph(userId, 2);

    // Build adjacency matrix
    const { matrix, nodes } = await this.buildAdjacencyMatrix(graph);

    // Spectral clustering
    const { SpectralClustering } = sklearn.cluster;
    const clustering = SpectralClustering({
      n_clusters: this.config.numCommunities,
      affinity: 'precomputed',
    });

    const labels = clustering.fit_predict(matrix);

    // Group users by community
    const communityMap = new Map<number, string[]>();
    for (let i = 0; i < nodes.length; i++) {
      const label = labels[i];
      if (!communityMap.has(label)) {
        communityMap.set(label, []);
      }
      communityMap.get(label)!.push(nodes[i]);
    }

    // Build community objects
    const communities: Community[] = [];
    for (const [id, members] of communityMap) {
      communities.push({
        id: `community_${id}`,
        members,
        size: members.length,
        topics: await this.identifyTopics(members),
        centrality: await this.calculateCommunityCentrality(members),
        density: await this.calculateCommunityDensity(members),
        avgEngagement: await this.calculateAvgEngagement(members),
      });
    }

    // Cache communities
    if (this.config.enableCaching) {
      this.communityCache.set(cacheKey, communities);
    }

    return communities;
  }

  /**
   * Build adjacency matrix
   */
  async buildAdjacencyMatrix(graph: any): Promise<{ matrix: any; nodes: string[] }> {
    const nodes = Array.from(new Set([
      ...Object.keys(graph),
      ...Object.values(graph).flatMap((g: any) => g.following),
    ]));

    const size = nodes.length;
    const matrix = Array(size).fill(0).map(() => Array(size).fill(0));

    // Fill matrix with connections
    for (let i = 0; i < nodes.length; i++) {
      const nodeId = nodes[i];
      const nodeGraph = graph[nodeId] || { following: [] };

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (nodeGraph.following.includes(nodes[j])) {
          matrix[i][j] = 1;
        }
      }
    }

    return { matrix: numpy.array(matrix), nodes };
  }

  /**
   * Calculate social distance
   */
  async calculateSocialDistance(
    userId: string,
    targetId: string,
    graph: SocialGraphType
  ): Promise<number> {
    // BFS to find shortest path
    const queue: Array<{ id: string; distance: number }> = [{ id: userId, distance: 0 }];
    const visited = new Set<string>([userId]);

    while (queue.length > 0) {
      const { id, distance } = queue.shift()!;

      if (id === targetId) {
        return distance;
      }

      if (distance >= this.config.maxGraphDepth) {
        continue;
      }

      const nodeGraph = await this.getUserGraph(id);
      for (const followingId of nodeGraph.following) {
        if (!visited.has(followingId)) {
          visited.add(followingId);
          queue.push({ id: followingId, distance: distance + 1 });
        }
      }
    }

    return Infinity;
  }

  /**
   * Helper methods
   */

  async getUserGraph(userId: string): Promise<SocialGraphType> {
    // Would load from database
    return {
      userId,
      followers: [],
      following: [],
      blockedUsers: [],
      mutedUsers: [],
      closeConnections: [],
      communities: [],
    };
  }

  async getExtendedGraph(userId: string, depth: number): Promise<any> {
    // Would build extended graph up to depth
    return {};
  }

  async getMutualFollowers(userId: string, targetId: string): Promise<number> {
    const userGraph = await this.getUserGraph(userId);
    const targetGraph = await this.getUserGraph(targetId);

    const mutual = userGraph.followers.filter(id => targetGraph.followers.includes(id));
    return mutual.length;
  }

  async getCommonInterests(userId: string, targetId: string): Promise<string[]> {
    // Would calculate based on post topics, hashtags, etc.
    return [];
  }

  async calculateActivitySimilarity(userId: string, targetId: string): Promise<number> {
    // Would calculate based on activity patterns
    return 0.5;
  }

  async checkSameLocation(userId: string, targetId: string): Promise<boolean> {
    // Would check user locations
    return false;
  }

  async areConnected(userId1: string, userId2: string): Promise<boolean> {
    const graph = await this.getUserGraph(userId1);
    return graph.following.includes(userId2);
  }

  async identifyTopics(members: string[]): Promise<string[]> {
    // Would analyze common topics among members
    return [];
  }

  async calculateCommunityCentrality(members: string[]): Promise<number> {
    return 0.5;
  }

  async calculateCommunityDensity(members: string[]): Promise<number> {
    return 0.5;
  }

  async calculateAvgEngagement(members: string[]): Promise<number> {
    return 0.5;
  }

  clearCache(): void {
    this.influenceCache.clear();
    this.communityCache.clear();
    this.recommendationCache.clear();
  }

  getStats(): any {
    return {
      graphsLoaded: this.graphs.size,
      influenceCached: this.influenceCache.size,
      communitiesCached: this.communityCache.size,
      recommendationsCached: this.recommendationCache.size,
      config: this.config,
    };
  }
}

/**
 * Create a default SocialGraph instance
 */
export function createSocialGraph(config?: Partial<SocialGraphConfig>): SocialGraph {
  return new SocialGraph(config);
}
