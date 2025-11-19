/**
 * Social Media Platform Type Definitions
 *
 * Comprehensive type system for the social media platform
 * including user management, posts, media, analytics, and ML features
 */

// ============================================================================
// Core User Types
// ============================================================================

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  verified: boolean;
  followers: number;
  following: number;
  posts: number;
  location?: string;
  website?: string;
  birthdate?: Date;
  joinedAt: Date;
  lastActive: Date;
  preferences: UserPreferences;
  privacy: PrivacySettings;
  stats: UserStats;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationPreferences;
  contentFilters: ContentFilters;
  accessibility: AccessibilitySettings;
}

export interface NotificationPreferences {
  enabled: Record<NotificationType, boolean>;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  frequency: 'realtime' | 'batched' | 'daily';
}

export type NotificationType =
  | 'new_follower'
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'mention'
  | 'direct_message'
  | 'friend_request'
  | 'trending'
  | 'recommendation';

export interface ContentFilters {
  hideNSFW: boolean;
  hideSpoilers: boolean;
  hideViolence: boolean;
  mutedWords: string[];
  mutedUsers: string[];
  mutedHashtags: string[];
}

export interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  autoPlayVideos: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  postVisibility: 'public' | 'followers' | 'private';
  allowMessages: 'everyone' | 'followers' | 'none';
  allowTagging: 'everyone' | 'followers' | 'none';
  allowComments: 'everyone' | 'followers' | 'none';
  showActivity: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  indexable: boolean;
}

export interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  engagementRate: number;
  averageLikesPerPost: number;
  averageCommentsPerPost: number;
  mostActiveHour: number;
  mostActiveDay: string;
  topHashtags: string[];
  topMentions: string[];
}

// ============================================================================
// Post Types
// ============================================================================

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  content: string;
  media: Media[];
  type: PostType;
  visibility: Visibility;
  hashtags: string[];
  mentions: string[];
  embedding?: Embedding;
  entities: Entity[];
  location?: Location;
  engagement: Engagement;
  metadata: PostMetadata;
  replyTo?: string;
  repostOf?: string;
  quotedPost?: string;
  editHistory?: PostEdit[];
  isPinned: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PostType = 'text' | 'image' | 'video' | 'poll' | 'article' | 'link';

export type Visibility = 'public' | 'followers' | 'private' | 'unlisted';

export interface PostEdit {
  content: string;
  editedAt: Date;
  reason?: string;
}

export interface PostMetadata {
  language: string;
  source: string; // web, mobile, api
  ipAddress?: string;
  deviceType?: string;
  sentiment?: Sentiment;
  topics?: string[];
  readingTime?: number;
  wordCount?: number;
}

export interface Engagement {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  clicks: number;
  engagementRate: number;
  viralCoefficient: number;
}

// ============================================================================
// Media Types
// ============================================================================

export interface Media {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  preview?: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // for videos
  metadata: MediaMetadata;
  processing: MediaProcessingStatus;
  altText?: string;
}

export type MediaType = 'image' | 'video' | 'audio' | 'gif';

export interface MediaMetadata {
  mimeType: string;
  originalFilename: string;
  uploadedAt: Date;
  exif?: ExifData;
  dominantColors?: string[];
  faces?: FaceDetection[];
  objects?: ObjectDetection[];
  scenes?: SceneDetection[];
  nsfw?: NSFWDetection;
  quality?: number;
}

export interface MediaProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface ExifData {
  camera?: string;
  lens?: string;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
  takenAt?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface FaceDetection {
  boundingBox: BoundingBox;
  confidence: number;
  landmarks?: FaceLandmarks;
  age?: number;
  gender?: 'male' | 'female';
  emotion?: string;
}

export interface ObjectDetection {
  label: string;
  boundingBox: BoundingBox;
  confidence: number;
}

export interface SceneDetection {
  label: string;
  confidence: number;
}

export interface NSFWDetection {
  isNSFW: boolean;
  score: number;
  categories: {
    nudity: number;
    sexual: number;
    violence: number;
    gore: number;
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceLandmarks {
  leftEye: Point;
  rightEye: Point;
  nose: Point;
  leftMouth: Point;
  rightMouth: Point;
}

export interface Point {
  x: number;
  y: number;
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  content: string;
  embedding?: Embedding;
  sentiment?: Sentiment;
  replyTo?: string;
  replies: Comment[];
  likes: number;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NLP & ML Types
// ============================================================================

export interface Embedding {
  model: string;
  vector: number[];
  dimensions: number;
  createdAt: Date;
}

export interface Entity {
  text: string;
  type: EntityType;
  startIndex: number;
  endIndex: number;
  confidence: number;
  metadata?: Record<string, any>;
}

export type EntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'time'
  | 'money'
  | 'percentage'
  | 'product'
  | 'event'
  | 'hashtag'
  | 'mention'
  | 'url'
  | 'email'
  | 'phone';

export interface Sentiment {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  aspects?: AspectSentiment[];
}

export interface AspectSentiment {
  aspect: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
}

// ============================================================================
// Content Moderation Types
// ============================================================================

export interface ModerationResult {
  approved: boolean;
  action: ModerationAction;
  reasons: ModerationReason[];
  scores: ModerationScores;
  confidence: number;
  reviewRequired: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export type ModerationAction = 'approve' | 'review' | 'reject' | 'shadow_ban';

export interface ModerationReason {
  category: ModerationCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
}

export type ModerationCategory =
  | 'spam'
  | 'toxicity'
  | 'hate_speech'
  | 'harassment'
  | 'violence'
  | 'self_harm'
  | 'sexual_content'
  | 'child_safety'
  | 'misinformation'
  | 'copyright'
  | 'privacy_violation'
  | 'impersonation';

export interface ModerationScores {
  toxicity: number;
  spam: number;
  hateSpeech: number;
  harassment: number;
  violence: number;
  selfHarm: number;
  sexual: number;
  nsfw: number;
  overall: number;
}

export interface TextModerationResult extends ModerationResult {
  textScores: {
    toxicity: number;
    severeToxicity: number;
    identityAttack: number;
    insult: number;
    profanity: number;
    threat: number;
  };
  language?: string;
  detectedPatterns?: string[];
}

export interface ImageModerationResult extends ModerationResult {
  imageScores: {
    nsfw: number;
    violence: number;
    gore: number;
    nudity: number;
    suggestive: number;
  };
  detectedObjects?: string[];
  detectedFaces?: number;
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface RecommendationScore {
  itemId: string;
  score: number;
  features: FeatureVector;
  algorithm: RecommendationAlgorithm;
  confidence: number;
  explanation?: string[];
}

export type RecommendationAlgorithm =
  | 'collaborative_filtering'
  | 'content_based'
  | 'hybrid'
  | 'trending'
  | 'social_graph'
  | 'personalized';

export interface FeatureVector {
  [key: string]: number;
}

export interface RecommendationContext {
  userId: string;
  sessionId: string;
  location?: Location;
  deviceType: string;
  timestamp: Date;
  recentActivity: UserActivity[];
}

export interface UserActivity {
  type: ActivityType;
  itemId: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export type ActivityType =
  | 'view'
  | 'like'
  | 'comment'
  | 'share'
  | 'save'
  | 'click'
  | 'follow'
  | 'unfollow'
  | 'block'
  | 'report';

export interface CollaborativeFilteringModel {
  userFactors: number[][];
  itemFactors: number[][];
  userBias: number[];
  itemBias: number[];
  globalBias: number;
  numFactors: number;
}

export interface ContentBasedModel {
  userProfiles: Map<string, number[]>;
  itemEmbeddings: Map<string, number[]>;
  similarityMetric: 'cosine' | 'euclidean' | 'dot_product';
}

// ============================================================================
// Feed Types
// ============================================================================

export interface FeedResponse {
  posts: Post[];
  nextCursor?: string;
  hasMore: boolean;
  metadata: FeedMetadata;
}

export interface FeedMetadata {
  algorithm: FeedAlgorithm;
  candidateCount: number;
  generationTime: number;
  personalizedScore?: number;
  diversityScore?: number;
}

export type FeedAlgorithm =
  | 'chronological'
  | 'engagement'
  | 'ml_ranker'
  | 'trending'
  | 'following'
  | 'explore';

export interface FeedRankingFeatures {
  // Post features
  postAge: number;
  engagementScore: number;
  viralScore: number;
  qualityScore: number;

  // Author features
  authorFollowers: number;
  authorEngagementRate: number;
  isFollowing: boolean;
  interactionHistory: number;

  // Content features
  topicRelevance: number;
  contentType: string;
  hasMedia: boolean;
  sentimentScore: number;

  // Context features
  timeOfDay: number;
  dayOfWeek: number;
  userActiveTime: boolean;

  // Social features
  mutualFollowers: number;
  socialDistance: number;
  communityOverlap: number;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchQuery {
  query: string;
  type: SearchType;
  filters?: SearchFilters;
  sort?: SearchSort;
  limit?: number;
  offset?: number;
}

export type SearchType =
  | 'posts'
  | 'users'
  | 'hashtags'
  | 'media'
  | 'all';

export interface SearchFilters {
  dateRange?: DateRange;
  location?: LocationFilter;
  language?: string[];
  hasMedia?: boolean;
  mediaType?: MediaType[];
  verified?: boolean;
  minEngagement?: number;
  fromUsers?: string[];
  hashtags?: string[];
}

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface LocationFilter {
  latitude: number;
  longitude: number;
  radius: number; // in km
}

export interface SearchSort {
  field: 'relevance' | 'date' | 'engagement' | 'followers';
  order: 'asc' | 'desc';
}

export interface SearchResults {
  results: SearchResult[];
  totalCount: number;
  query: string;
  processingTime: number;
  searchType: SearchType;
  suggestions?: string[];
}

export interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'hashtag';
  score: number;
  highlight?: Record<string, string[]>;
  data: Post | User | Hashtag;
}

export interface Hashtag {
  tag: string;
  count: number;
  trending: boolean;
  relatedTags: string[];
  recentPosts: Post[];
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface EngagementMetrics {
  postId: string;
  views: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number;
  viralCoefficient: number;
  averageTimeSpent: number;
  peakTime: Date;
  retention: RetentionMetrics;
  demographics: DemographicBreakdown;
  sources: SourceBreakdown;
}

export interface RetentionMetrics {
  day1: number;
  day7: number;
  day30: number;
  cohortSize: number;
}

export interface DemographicBreakdown {
  byAge: Record<string, number>;
  byGender: Record<string, number>;
  byLocation: Record<string, number>;
  byDevice: Record<string, number>;
}

export interface SourceBreakdown {
  organic: number;
  viral: number;
  promoted: number;
  external: number;
}

export interface TrendingContent {
  postId: string;
  post?: Post;
  trendScore: number;
  velocity: number; // engagement per hour
  peakVelocity: number;
  startedTrendingAt: Date;
  category?: string;
  relatedHashtags: string[];
}

export interface UserEngagementProfile {
  userId: string;
  activityScore: number;
  peakHours: number[];
  peakDays: string[];
  preferences: ContentPreferences;
  segment: UserSegment;
  ltv: number; // lifetime value
  churnRisk: number;
  lastActive: Date;
  averageSessionDuration: number;
  sessionsPerWeek: number;
}

export interface ContentPreferences {
  topTopics: Array<{ topic: string; score: number }>;
  mediaPreference: Record<MediaType, number>;
  lengthPreference: 'short' | 'medium' | 'long';
  sentimentPreference: 'positive' | 'neutral' | 'negative';
}

export type UserSegment =
  | 'power_user'
  | 'casual_user'
  | 'lurker'
  | 'creator'
  | 'influencer'
  | 'new_user'
  | 'at_risk'
  | 'inactive';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  properties: Record<string, any>;
  context: EventContext;
}

export type AnalyticsEventType =
  | 'page_view'
  | 'post_view'
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'post_save'
  | 'profile_view'
  | 'follow'
  | 'unfollow'
  | 'search'
  | 'click'
  | 'session_start'
  | 'session_end';

export interface EventContext {
  url: string;
  referrer?: string;
  userAgent: string;
  ipAddress: string;
  location?: Location;
  device: DeviceInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screenSize: string;
}

// ============================================================================
// Social Graph Types
// ============================================================================

export interface SocialGraph {
  userId: string;
  followers: string[];
  following: string[];
  blockedUsers: string[];
  mutedUsers: string[];
  closeConnections: string[];
  communities: string[];
}

export interface FollowRelationship {
  followerId: string;
  followingId: string;
  createdAt: Date;
  notificationsEnabled: boolean;
  lists?: string[];
}

export interface InfluenceMetrics {
  userId: string;
  followers: number;
  following: number;
  pageRank: number;
  betweenness: number;
  clustering: number;
  reach: number;
  engagementInfluence: number;
  communityInfluence: number;
  overallScore: number;
}

export interface Community {
  id: string;
  name?: string;
  members: string[];
  size: number;
  topics: string[];
  centrality: number;
  density: number;
  avgEngagement: number;
}

export interface FriendRecommendation {
  userId: string;
  user?: User;
  score: number;
  reasons: RecommendationReason[];
  mutualFollowers: number;
  commonInterests: string[];
  socialDistance: number;
}

export interface RecommendationReason {
  type: ReasonType;
  description: string;
  strength: number;
}

export type ReasonType =
  | 'mutual_followers'
  | 'common_interests'
  | 'same_community'
  | 'similar_activity'
  | 'location_proximity'
  | 'popular_in_network';

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  template?: string;
  data: Record<string, any>;
  priority: NotificationPriority;
  urgent: boolean;
  read: boolean;
  clicked: boolean;
  channels: NotificationChannel[];
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  expiresAt?: Date;
}

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface NotificationBatch {
  userId: string;
  notifications: Notification[];
  batchedAt: Date;
  sendAt: Date;
}

// ============================================================================
// Location Types
// ============================================================================

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  region?: string;
  accuracy?: number;
}

// ============================================================================
// Platform Configuration Types
// ============================================================================

export interface PlatformConfig {
  moderation: ModerationConfig;
  recommendations: RecommendationConfig;
  feed: FeedConfig;
  search: SearchConfig;
  analytics: AnalyticsConfig;
  performance: PerformanceConfig;
  media: MediaConfig;
}

export interface ModerationConfig {
  toxicityThreshold: number;
  nsfwThreshold: number;
  spamThreshold: number;
  autoReject: boolean;
  autoReview: boolean;
  humanReviewQueue: boolean;
  enablePreModeration: boolean;
  enablePostModeration: boolean;
}

export interface RecommendationConfig {
  algorithm: RecommendationAlgorithm;
  updateFrequency: number;
  diversityWeight: number;
  noveltyWeight: number;
  popularityWeight: number;
  enableColdStart: boolean;
  minConfidence: number;
}

export interface FeedConfig {
  defaultAlgorithm: FeedAlgorithm;
  cacheSize: number;
  cacheTTL: number;
  updateInterval: number;
  maxCandidates: number;
  diversityEnabled: boolean;
  trendingBoost: number;
}

export interface SearchConfig {
  type: 'text' | 'semantic' | 'hybrid';
  resultsPerPage: number;
  maxResults: number;
  enableAutocomplete: boolean;
  enableSpellCorrection: boolean;
  enableQueryExpansion: boolean;
  minScore: number;
}

export interface AnalyticsConfig {
  enabled: boolean;
  samplingRate: number;
  batchSize: number;
  flushInterval: number;
  enableRealtime: boolean;
  retentionDays: number;
}

export interface PerformanceConfig {
  maxConcurrency: number;
  requestTimeout: number;
  enableCaching: boolean;
  cacheStrategy: 'lru' | 'lfu' | 'ttl';
  poolSize: number;
  queueSize: number;
}

export interface MediaConfig {
  maxImageSize: number; // bytes
  maxVideoSize: number; // bytes
  maxVideoDuration: number; // seconds
  allowedImageFormats: string[];
  allowedVideoFormats: string[];
  thumbnailSizes: number[];
  compressionQuality: number;
  enableAutoTagging: boolean;
  enableNSFWDetection: boolean;
}

// ============================================================================
// Processing Types
// ============================================================================

export interface ProcessedText {
  text: string;
  embedding: Embedding;
  entities: Entity[];
  hashtags: string[];
  mentions: string[];
  urls: string[];
  sentiment: Sentiment;
  language: string;
  topics: string[];
  readingTime: number;
  wordCount: number;
}

export interface ProcessedImage {
  imageId: string;
  thumbnail: Buffer;
  preview: Buffer;
  full: Buffer;
  metadata: MediaMetadata;
  features: ImageFeatures;
}

export interface ImageFeatures {
  dominantColors: string[];
  faces: FaceDetection[];
  objects: ObjectDetection[];
  scenes: SceneDetection[];
  aesthetic: AestheticScore;
  quality: number;
}

export interface AestheticScore {
  overall: number;
  composition: number;
  lighting: number;
  colorHarmony: number;
  sharpness: number;
}

export interface ProcessedVideo {
  videoId: string;
  thumbnails: Buffer[];
  preview: Buffer;
  metadata: MediaMetadata;
  scenes: VideoScene[];
  transcription?: string;
}

export interface VideoScene {
  startTime: number;
  endTime: number;
  thumbnail: Buffer;
  description: string;
  confidence: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface PlatformError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  stack?: string;
}

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMIT'
  | 'MODERATION_FAILED'
  | 'PROCESSING_FAILED'
  | 'UPLOAD_FAILED'
  | 'INTERNAL_ERROR';

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Pagination = {
  cursor?: string;
  limit?: number;
  offset?: number;
};

export type TimestampFields = {
  createdAt: Date;
  updatedAt: Date;
};
